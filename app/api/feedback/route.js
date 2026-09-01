import { connectDB } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth';
import ServiceFeedback from '@/models/ServiceFeedback';

export async function POST(req) {
  try {
    const session = await getServerSession();
    await connectDB();

    const { rating, aspects, comments, serviceType, contactAllowed } = await req.json();

    const feedback = await ServiceFeedback.create({
      userId: session?.user?.id,
      serviceType,
      rating,
      aspects,
      comments,
      contactAllowed,
    });

    return Response.json(feedback, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const feedback = await ServiceFeedback.find().sort({ createdAt: -1 }).limit(100);

    return Response.json(feedback);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
