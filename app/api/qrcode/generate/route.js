import dbConnect from '@/lib/dbConnect';
import QRCode from 'qrcode';
import Application from '@/models/Application';
import Query from '@/models/Query';

export async function GET(req) {
  try {
    await dbConnect();

    const { type, id } = req.nextUrl.searchParams;

    if (!type || !id) {
      return Response.json({ error: 'Missing type or id' }, { status: 400 });
    }

    let entity;
    let trackingUrl;

    if (type === 'application') {
      entity = await Application.findById(id);
      trackingUrl = `${process.env.NEXTAUTH_URL}/track?appId=${id}`;
    } else if (type === 'query') {
      entity = await Query.findById(id);
      trackingUrl = `${process.env.NEXTAUTH_URL}/track?queryId=${id}`;
    }

    if (!entity) {
      return Response.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Generate QR Code as data URL
    const qrCode = await QRCode.toDataURL(trackingUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return Response.json({ qrCode, trackingUrl });
  } catch (error) {
    console.error('QR generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
