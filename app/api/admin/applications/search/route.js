import dbConnect from '@/lib/dbConnect';
import { requireAdminSession } from '@/lib/adminAuth';
import Application from '@/models/Application';

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
      type,
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

    // Service type filter
    if (type && type !== 'all') {
      query.type = type;
    }

    // Search by applicant name, email, or phone
    if (searchTerm) {
      query.$or = [
        { 'applicantInfo.name': { $regex: searchTerm, $options: 'i' } },
        { 'applicantInfo.email': { $regex: searchTerm, $options: 'i' } },
        { 'applicantInfo.phone': { $regex: searchTerm, $options: 'i' } },
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
    const total = await Application.countDocuments(query);

    // Fetch paginated results
    const sortObj = { [sortBy]: sortOrder };
    const applications = await Application.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('_id type applicantInfo status createdAt updatedAt documents adminDocuments');

    return Response.json({
      data: applications,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
