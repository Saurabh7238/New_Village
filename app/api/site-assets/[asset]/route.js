import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SiteAsset from '@/models/SiteAsset';

const ALLOWED_ASSETS = ['logo', 'darkLogo', 'favicon', 'heroImage'];

export async function GET(_request, { params }) {
  try {
    const { asset: key } = await params;
    if (!ALLOWED_ASSETS.includes(key)) {
      return NextResponse.json({ message: 'Asset not found.' }, { status: 404 });
    }

    await dbConnect();
    const siteAsset = await SiteAsset.findOne({ key }).select('data mimeType').lean();
    if (!siteAsset) {
      if (key === 'logo' || key === 'darkLogo' || key === 'favicon') {
        return NextResponse.redirect(new URL('/favicon.png', _request.url), 307);
      }
      return NextResponse.json({ message: 'Asset not found.' }, { status: 404 });
    }

    return new NextResponse(Buffer.from(siteAsset.data, 'base64'), {
      headers: {
        'Content-Type': siteAsset.mimeType,
        'Content-Length': String(Buffer.byteLength(siteAsset.data, 'base64')),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (error) {
    console.error('Failed to serve branding asset:', error);
    return NextResponse.json({ message: 'Unable to load branding asset.' }, { status: 500 });
  }
}
