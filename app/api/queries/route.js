import { NextResponse } from 'next/server';
import Query from '@/models/Query';
import QueryCounter from '@/models/QueryCounter';
import connectDB from '@/lib/dbConnect';
import { checkQueryRateLimit } from '@/lib/rateLimit';
import { isAbusive, generateQueryId, getAutoAssignedOfficer } from '@/lib/queryDisplay';
import { requireAdminSession } from '@/lib/adminAuth';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';
import User from '@/models/User';
import CitizenNotification from '@/models/CitizenNotification';
import ServiceNotification from '@/models/ServiceNotification';

export async function POST(request) {
  await connectDB();

  try {
    const session = await requireAuthenticatedSession();
    if (!session) {
      return NextResponse.json({ message: 'Please sign in to submit a query.' }, { status: 401 });
    }

    const citizen = await User.findById(session.user.id).select('name phone village ward address status');
    if (!citizen || citizen.status !== 'active') {
      return NextResponse.json({ message: 'Your account is unavailable. Please contact the Panchayat office.' }, { status: 403 });
    }

    const { category, subject, description, priority, attachment } = await request.json();
    const { name, phone: mobile, ward, village, address } = citizen;

    if (!name || !mobile || !ward || !category || !subject || !description) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const rateLimit = await checkQueryRateLimit(mobile);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: rateLimit.message || 'Daily query limit exceeded' },
        { status: 429 }
      );
    }

    if (isAbusive(subject) || isAbusive(description)) {
      return NextResponse.json(
        { message: 'Your message contains inappropriate content. Please revise.' },
        { status: 400 }
      );
    }

    const counter = await QueryCounter.findByIdAndUpdate(
      'query',
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    const queryId = generateQueryId(counter.count);
    const assignedTo = getAutoAssignedOfficer(ward);

    const newQuery = new Query({
      queryId,
      name,
      mobile,
      userId: citizen._id,
      ward: Number(ward),
      village,
      category,
      subject,
      description,
      address: address || '',
      attachments: attachment ? [attachment] : [],
      assignedTo,
      priority: ['High', 'Medium', 'Low'].includes(priority) ? priority : ['Water', 'Health/PHC'].includes(category) ? 'High' : 'Medium',
      auditLog: [
        {
          action: 'Query Created',
          changedBy: 'System',
          from: null,
          to: 'New'
        }
      ]
    });

    await newQuery.save();
    await ServiceNotification.create({ userId: citizen._id, serviceType: `query:${category}`, relatedType: 'query', relatedId: newQuery._id, queryRaised: newQuery.createdAt });

    await CitizenNotification.create({
      userId: citizen._id,
      title: `Query ${queryId} submitted`,
      message: 'Your query has been submitted successfully and is pending review.',
      type: 'query',
      relatedType: 'query',
      relatedId: newQuery._id,
    });

    return NextResponse.json({
      message: 'Query submitted successfully',
      queryId: newQuery.queryId,
      _id: newQuery._id,
      createdAt: newQuery.createdAt
    }, { status: 201 });
  } catch (error) {
    console.error('Query creation error:', error);
    return NextResponse.json(
      { message: 'Error creating query' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const ward = searchParams.get('ward');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const session = await requireAdminSession();
    const isAdmin = !!session;

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const filter = {};

    if (isAdmin && search) {
      filter.$or = [
        { queryId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (isAdmin) {
      if (ward) filter.ward = parseInt(ward);
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (priority) filter.priority = priority;
    }

    if (isAdmin && (dateFrom || dateTo)) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const [queries, total] = await Promise.all([
      Query.find(filter)
        .select('queryId name mobile ward category subject status priority assignedTo escalate createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Query.countDocuments(filter),
    ]);

    return NextResponse.json({ queries, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, { status: 200 });
  } catch (error) {
    console.error('Query fetch error:', error);
    return NextResponse.json(
      { message: 'Error fetching queries' },
      { status: 500 }
    );
  }
}
