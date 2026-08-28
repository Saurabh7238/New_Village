import { NextResponse } from 'next/server';
import Query from '@/models/Query';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';
import { PDFDocument, rgb } from 'pdf-lib';
import { requireAuthenticatedSession } from '@/lib/sessionAuth';

export async function GET(request, { params }) {
  const session = await requireAuthenticatedSession();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  await connectDB();

  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'resolution' or 'acknowledgment'

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid query ID format' },
        { status: 400 }
      );
    }

    if (!type || !['resolution', 'acknowledgment'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid PDF type. Must be "resolution" or "acknowledgment"' },
        { status: 400 }
      );
    }

    const query = await Query.findById(id);

    if (!query) {
      return NextResponse.json(
        { message: 'Query not found' },
        { status: 404 }
      );
    }
    if (session.user.role !== 'admin' && query.userId?.toString() !== session.user.id) {
      return NextResponse.json({ message: 'You cannot access this acknowledgement.' }, { status: 403 });
    }

    // Generate PDF using pdf-lib
    const pdfBuffer = await generatePDF(query, type);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="query-${id}-${type}.pdf"`,
        'Content-Length': pdfBuffer.length,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { message: 'Error generating PDF' },
      { status: 500 }
    );
  }
}

async function generatePDF(query, type) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  const drawText = (text, size = 12, bold = false, color = rgb(0, 0, 0)) => {
    page.drawText(text, {
      x: margin,
      y,
      size,
      color,
      font: bold ? undefined : undefined,
      maxWidth: 600 - 2 * margin,
    });
    y -= size + 4;
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: 600 - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 8;
  };

  // Header
  drawText('GRAM PANCHAYAT CHIUTAHARA', 14, true);
  drawText('Lalganj, Azamgarh District, Uttar Pradesh', 9);
  y -= 5;
  drawLine();

  if (type === 'acknowledgment') {
    drawText('QUERY ACKNOWLEDGMENT RECEIPT', 13, true);
    y -= 8;

    drawText('Query Information:', 10, true);
    drawText(`Query ID: ${query.queryId || query._id}`, 9);
    drawText(`Date of Submission: ${new Date(query.createdAt).toLocaleDateString()}`, 9);
    y -= 5;

    drawText('Applicant Details:', 10, true);
    drawText(`Name: ${query.name}`, 9);
    drawText(`Mobile: ${query.mobile}`, 9);
    drawText(`Ward: ${query.ward}`, 9);
    drawText(`Address: ${query.address || 'N/A'}`, 9);
    y -= 5;

    drawText('Query Details:', 10, true);
    drawText(`Category: ${query.category}`, 9);
    drawText(`Subject: ${query.subject}`, 9);
    drawText(`Description: ${query.description}`, 9);
    drawText(`Status: ${query.status}`, 9);
    drawText(`Priority: ${query.priority}`, 9);
    if (query.adminRemarks) {
      y -= 4;
      drawText('Latest Panchayat Update:', 10, true);
      drawText(`Admin Remarks: ${query.adminRemarks}`, 9);
    }
    if (query.attachments?.length) {
      y -= 4;
      drawText('Supporting Documents:', 10, true);
      query.attachments.forEach((attachment, index) => drawText(`${index + 1}. ${attachment.fileName || 'Attached document'}`, 9));
    }
    y -= 8;

    drawText(
      'This is to acknowledge the receipt of your query. Our team will review and process your request accordingly.',
      9
    );
    drawText('Expected Resolution Time: 7-30 days based on priority', 9);
    y -= 8;

    drawText('For any queries, contact the Gram Panchayat office.', 8);
  } else if (type === 'resolution') {
    drawText('QUERY RESOLUTION REPORT', 13, true);
    y -= 8;

    drawText('Query Information:', 10, true);
    drawText(`Query ID: ${query.queryId || query._id}`, 9);
    drawText(`Date of Submission: ${new Date(query.createdAt).toLocaleDateString()}`, 9);
    drawText(
      `Date of Resolution: ${query.resolvedAt ? new Date(query.resolvedAt).toLocaleDateString() : 'Pending'}`,
      9
    );
    y -= 5;

    drawText('Applicant Details:', 10, true);
    drawText(`Name: ${query.name}`, 9);
    drawText(`Mobile: ${query.mobile}`, 9);
    drawText(`Ward: ${query.ward}`, 9);
    y -= 5;

    drawText('Query Details:', 10, true);
    drawText(`Category: ${query.category}`, 9);
    drawText(`Subject: ${query.subject}`, 9);
    drawText(`Description: ${query.description}`, 9);
    y -= 5;

    drawText('Resolution Details:', 10, true);
    drawText(`Resolution Status: ${query.status}`, 9);
    drawText(`Admin Remarks: ${query.adminRemarks || 'No remarks'}`, 9);
    y -= 8;

    drawText(
      'This certifies that your query has been processed and resolved as per the details mentioned above.',
      9
    );
  }

  y -= 8;
  drawText(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 8);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
