import { NextResponse } from 'next/server';
import Query from '@/models/Query';
import QueryCounter from '@/models/QueryCounter';
import connectDB from '@/lib/dbConnect';
import { checkQueryRateLimit } from '@/lib/rateLimit';
import { isAbusive, generateQueryId, getAutoAssignedOfficer } from '@/lib/queryDisplay';

export async function POST(request) {
  await connectDB();

  try {
    const { name, mobile, ward, category, subject, description, address, photo } = await request.json();

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
      ward: parseInt(ward),
      category,
      subject,
      description,
      address: address || '',
      photo: photo || null,
      assignedTo,
      priority: ['Water', 'Health/PHC'].includes(category) ? 'High' : 'Medium',
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
    const mobile = searchParams.get('mobile');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const filter = {};

    if (search) {
      filter.$or = [
        { queryId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (ward) filter.ward = parseInt(ward);
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (mobile) filter.mobile = mobile;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const queries = await Query.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json(queries, { status: 200 });
  } catch (error) {
    console.error('Query fetch error:', error);
    return NextResponse.json(
      { message: 'Error fetching queries' },
      { status: 500 }
    );
  }
}
