import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Query from '@/models/Query';
import { requireAdminSession } from '@/lib/adminAuth';
import { checkSlaBreach } from '@/lib/escalationRules';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  try {
    await dbConnect();
    const activeQueries = await Query.find({
      status: { $in: ['New', 'Acknowledged', 'In Progress'] },
    })
      .select('_id queryId subject category ward status createdAt')
      .lean();

    const overdue = activeQueries
      .map((query) => ({ query, breach: checkSlaBreach(query) }))
      .filter(({ breach }) => breach.breached)
      .sort((left, right) => left.breach.timeData.deadline - right.breach.timeData.deadline);

    return NextResponse.json({
      count: overdue.length,
      items: overdue.slice(0, 10).map(({ query, breach }) => ({
        id: query._id.toString(),
        queryId: query.queryId,
        subject: query.subject,
        category: query.category,
        ward: query.ward,
        status: query.status,
        breachType: breach.type,
        deadline: breach.timeData.deadline,
        overdueDays: breach.timeData.days,
        overdueHours: breach.timeData.hours,
      })),
      checkedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('SLA alert load failed:', error);
    return NextResponse.json({ message: 'Unable to load overdue grievance alerts.' }, { status: 500 });
  }
}
