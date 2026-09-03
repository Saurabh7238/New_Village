import dbConnect from '@/lib/dbConnect';
import { getServerSession } from 'next-auth';
import Draft from '@/models/Draft';

export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const serviceType = req.nextUrl.searchParams.get('serviceType');
    const drafts = await Draft.find({
      userId: session.user.id,
      isDraft: true,
      ...(serviceType ? { serviceType } : {}),
    }).sort({ lastSavedAt: -1 });

    return Response.json(drafts);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { serviceType, title, data } = await req.json();
    if (!serviceType || !data || typeof data !== 'object' || Array.isArray(data) || JSON.stringify(data).length > 20000) {
      return Response.json({ error: 'Valid application draft data is required.' }, { status: 400 });
    }

    // Update existing draft or create new one
    const draft = await Draft.findOneAndUpdate(
      { userId: session.user.id, serviceType, isDraft: true },
      {
        title,
        data,
        lastSavedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return Response.json(draft, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Draft ID required' }, { status: 400 });
    }

    const result = await Draft.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!result) {
      return Response.json({ error: 'Draft not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
