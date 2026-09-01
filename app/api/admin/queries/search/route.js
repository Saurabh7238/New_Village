import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import Query from '@/models/Query';

export async function POST(req) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { filters } = await req.json();
    const {
      status,
      category,
      priority,
      searchTerm,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = -1,
      page = 1,
      limit = 10,
    } = filters || {};

    // Build query
    const query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search by title, description, or citizen name
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'citizenInfo.name': { $regex: searchTerm, $options: 'i' } },
        { 'citizenInfo.email': { $regex: searchTerm, $options: 'i' } },
        { _id: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Count total
    const total = await Query.countDocuments(query);

    // Fetch paginated results
    const sortObj = { [sortBy]: sortOrder };
    const queries = await Query.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('_id title category status priority createdAt updatedAt citizenInfo messages');

    return Response.json({
      data: queries,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
