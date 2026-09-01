import { connectDB } from '@/lib/dbConnect';
import { adminAuth } from '@/lib/adminAuth';
import Application from '@/models/Application';
import Query from '@/models/Query';
import { PDFDocument, rgb } from 'pdf-lib';

export async function POST(req) {
  try {
    const session = await adminAuth(req);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { reportType, format, filters } = await req.json();

    if (reportType === 'applications') {
      const query = {};
      if (filters?.status) query.status = filters.status;
      if (filters?.type) query.type = filters.type;

      const applications = await Application.find(query).lean();

      if (format === 'csv') {
        const headers = ['ID', 'Type', 'Applicant', 'Email', 'Status', 'Created Date'];
        const rows = applications.map((app) => [
          app._id,
          app.type,
          app.applicantInfo?.name || 'N/A',
          app.applicantInfo?.email || 'N/A',
          app.status,
          new Date(app.createdAt).toLocaleDateString(),
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="applications.csv"',
          },
        });
      } else if (format === 'json') {
        return Response.json({
          report: 'Applications Report',
          generatedAt: new Date().toISOString(),
          data: applications,
        });
      }
    } else if (reportType === 'queries') {
      const query = {};
      if (filters?.status) query.status = filters.status;
      if (filters?.category) query.category = filters.category;

      const queries = await Query.find(query).lean();

      if (format === 'csv') {
        const headers = ['ID', 'Title', 'Category', 'Status', 'Priority', 'Created Date'];
        const rows = queries.map((q) => [
          q._id,
          q.title,
          q.category,
          q.status,
          q.priority,
          new Date(q.createdAt).toLocaleDateString(),
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="queries.csv"',
          },
        });
      }
    }

    return Response.json({ error: 'Invalid report type or format' }, { status: 400 });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
