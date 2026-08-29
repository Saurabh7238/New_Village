import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Query from '@/models/Query';
import QueryMessage from '@/models/QueryMessage';
import CitizenNotification from '@/models/CitizenNotification';
import ServiceNotification from '@/models/ServiceNotification';
import { requireAuthenticatedSession, isAdminOrStaff } from '@/lib/sessionAuth';

async function getAuthorizedQuery(id, session) {
  const query = await Query.findById(id);
  if (!query) return null;
  if (!isAdminOrStaff(session) && String(query.userId) !== String(session.user.id)) return false;
  return query;
}

export async function GET(_request, { params }) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const query = await getAuthorizedQuery(params.id, session);
  if (!query) return NextResponse.json({ message: 'Query not found' }, { status: 404 });
  if (query === false) return NextResponse.json({ message: 'Query not found' }, { status: 404 });
  const messages = await QueryMessage.find({ queryId: query._id }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ messages: messages.map((message) => ({ ...message, id: message._id.toString() })) });
}

export async function POST(request, { params }) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const query = await getAuthorizedQuery(params.id, session);
  if (!query || query === false) return NextResponse.json({ message: 'Query not found' }, { status: 404 });
  if (!isAdminOrStaff(session) && query.status === 'Closed') return NextResponse.json({ message: 'Closed queries cannot receive replies' }, { status: 409 });
  const { message } = await request.json();
  if (!message?.trim() || message.trim().length > 4000) return NextResponse.json({ message: 'Enter a message up to 4,000 characters' }, { status: 400 });
  const senderRole = isAdminOrStaff(session) ? session.user.role : 'citizen';
  const saved = await QueryMessage.create({ queryId: query._id, senderId: session.user.id, senderRole, message: message.trim() });
  if (senderRole !== 'citizen') {
    await ServiceNotification.findOneAndUpdate(
      { relatedType: 'query', relatedId: query._id },
      {
        $set: { adminResponded: new Date(), isRead: false },
        $setOnInsert: {
          userId: query.userId,
          serviceType: `query:${query.category}`,
          queryRaised: query.createdAt,
        },
      },
      { upsert: true },
    );
    await CitizenNotification.create({ userId: query.userId, title: `New response on ${query.queryId}`, message: 'Panchayat Admin has replied to your query.', type: 'message', relatedType: 'query', relatedId: query._id });
  }
  return NextResponse.json({ message: { ...saved.toObject(), id: saved._id.toString() } }, { status: 201 });
}
