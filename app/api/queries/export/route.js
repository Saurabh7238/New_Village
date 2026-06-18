import { NextResponse } from 'next/server';
import Query from '@/models/Query';
import connectDB from '@/lib/dbConnect';
import * as XLSX from 'xlsx';

export async function POST(request) {
  await connectDB();

  try {
    const { filters } = await request.json();
    const query = {};

    if (filters.ward) query.ward = parseInt(filters.ward);
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;

    const queries = await Query.find(query).lean();

    const data = queries.map(q => ({
      'Query ID': q.queryId,
      'Name': q.name,
      'Mobile': q.mobile,
      'Ward': q.ward,
      'Category': q.category,
      'Subject': q.subject,
      'Status': q.status,
      'Priority': q.priority,
      'Assigned To': q.assignedTo || '-',
      'Created': q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN') : '-',
      'Acknowledged': q.acknowledgedAt ? new Date(q.acknowledgedAt).toLocaleDateString('en-IN') : '-',
      'Resolved': q.resolvedAt ? new Date(q.resolvedAt).toLocaleDateString('en-IN') : '-',
      'Admin Remarks': q.adminRemarks || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Queries');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="queries_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { message: 'Error exporting queries' },
      { status: 500 }
    );
  }
}
