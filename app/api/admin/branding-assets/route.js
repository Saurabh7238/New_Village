import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import SiteAsset from '@/models/SiteAsset';

export const runtime = 'nodejs';

const ASSET_RULES = {
  logo: {
    label: 'Light theme logo',
    maxLabel: '1 MB',
    maxBytes: 1024 * 1024,
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
  },
  darkLogo: {
    label: 'Dark theme logo',
    maxLabel: '1 MB',
    maxBytes: 1024 * 1024,
    extensions: ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
  },
  favicon: {
    label: 'Favicon',
    maxLabel: '512 KB',
    maxBytes: 512 * 1024,
    extensions: ['.ico', '.png', '.svg', '.jpg', '.jpeg'],
  },
  heroImage: {
    label: 'Homepage hero background',
    maxLabel: '4 MB',
    maxBytes: 4 * 1024 * 1024,
    extensions: ['.png', '.jpg', '.jpeg', '.webp'],
  },
};

const MIME_TYPES = {
  '.ico': ['image/x-icon', 'image/vnd.microsoft.icon', 'application/octet-stream'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.svg': ['image/svg+xml'],
  '.webp': ['image/webp'],
};

function isValidImageBytes(extension, bytes) {
  if (extension === '.png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (extension === '.jpg' || extension === '.jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (extension === '.ico') {
    return bytes.length >= 6 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0;
  }
  if (extension === '.webp') {
    return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  }
  if (extension === '.svg') {
    const svg = bytes.toString('utf8');
    return /<svg(?:\s|>)/i.test(svg)
      && !/<(?:script|foreignObject)\b/i.test(svg)
      && !/\bon[a-z]+\s*=/i.test(svg)
      && !/(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|javascript:|data:)/i.test(svg)
      && !/url\(\s*["']?\s*(?:https?:|\/\/|javascript:|data:)/i.test(svg)
      && !/<!DOCTYPE|<!ENTITY/i.test(svg);
  }
  return false;
}

function publicAsset(asset) {
  return {
    url: `/api/site-assets/${asset.key}?v=${new Date(asset.updatedAt).getTime()}`,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
  };
}

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    }

    await dbConnect();
    const assets = await SiteAsset.find({}).select('key mimeType fileName updatedAt').lean();
    return NextResponse.json({
      success: true,
      assets: Object.fromEntries(assets.map((asset) => [asset.key, publicAsset(asset)])),
    });
  } catch (error) {
    console.error('Failed to load branding assets:', error);
    return NextResponse.json({ success: false, message: 'Unable to load branding assets.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const key = formData.get('key');
    const file = formData.get('file');
    const rules = ASSET_RULES[key];

    if (!rules || !file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ success: false, message: 'Choose a valid branding asset and file.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > rules.maxBytes) {
      return NextResponse.json({
        success: false,
        message: `${rules.label} must be no larger than ${rules.maxLabel}.`,
      }, { status: 413 });
    }

    const fileName = String(file.name || '').replace(/[\\/]/g, '').trim();
    const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    const mimeType = MIME_TYPES[extension] && MIME_TYPES[extension].includes(file.type)
      ? (extension === '.ico' ? 'image/x-icon' : MIME_TYPES[extension][0])
      : null;
    const bytes = Buffer.from(await file.arrayBuffer());

    if (!rules.extensions.includes(extension) || !mimeType || !isValidImageBytes(extension, bytes)) {
      return NextResponse.json({
        success: false,
        message: `Upload a valid ${rules.extensions.join(', ')} file for ${rules.label.toLowerCase()}.`,
      }, { status: 400 });
    }

    await dbConnect();
    const asset = await SiteAsset.findOneAndUpdate(
      { key },
      {
        key,
        data: bytes.toString('base64'),
        mimeType,
        fileName: fileName.slice(0, 120),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).select('key mimeType fileName updatedAt').lean();

    return NextResponse.json({ success: true, asset: publicAsset(asset) });
  } catch (error) {
    console.error('Failed to save branding asset:', error);
    return NextResponse.json({ success: false, message: 'Unable to save branding asset.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    }

    const { key } = await request.json();
    if (!Object.hasOwn(ASSET_RULES, key)) {
      return NextResponse.json({ success: false, message: 'Choose a valid branding asset.' }, { status: 400 });
    }

    await dbConnect();
    await SiteAsset.deleteOne({ key });
    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error('Failed to remove branding asset:', error);
    return NextResponse.json({ success: false, message: 'Unable to remove branding asset.' }, { status: 500 });
  }
}
