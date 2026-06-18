import { NextResponse } from 'next/server';
import Development from '@/models/Development';
import mongoose from 'mongoose';
import connectDB from '@/lib/dbConnect';

export async function POST(request) {
  await connectDB();

  try {
    const data = await request.json();
    const {
      id,
      title,
      description,
      scheme,
      financialYear,
      sanctionedAmount,
      amountSpent,
      wardNo,
      location,
      status,
      physicalProgress,
      startDate,
      expectedCompletion,
      actualCompletion,
      implementingAgency,
      beneficiaryCount,
      beforePhoto,
      afterPhoto,
      workOrderPDF,
      socialAuditReport,
      displayOrder
    } = data;

    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid project ID format.' }, { status: 400 });
    }

    if (!title || !scheme || !financialYear || !sanctionedAmount || !wardNo || !location?.address || !status || physicalProgress === undefined || !startDate || !expectedCompletion || !implementingAgency) {
      return NextResponse.json(
        { message: 'All mandatory fields are required.' },
        { status: 400 }
      );
    }

    const payload = {
      title,
      description: description || '',
      scheme,
      financialYear,
      sanctionedAmount: parseFloat(sanctionedAmount),
      amountSpent: parseFloat(amountSpent) || 0,
      wardNo: parseInt(wardNo),
      location: {
        latitude: location.latitude ? parseFloat(location.latitude) : null,
        longitude: location.longitude ? parseFloat(location.longitude) : null,
        address: location.address
      },
      status,
      physicalProgress: parseInt(physicalProgress),
      startDate: new Date(startDate),
      expectedCompletion: new Date(expectedCompletion),
      actualCompletion: actualCompletion ? new Date(actualCompletion) : null,
      implementingAgency,
      beneficiaryCount: beneficiaryCount || '',
      beforePhoto: beforePhoto || null,
      afterPhoto: afterPhoto || null,
      workOrderPDF: {
        data: workOrderPDF?.data || null,
        name: workOrderPDF?.name || null,
        mimeType: workOrderPDF?.mimeType || 'application/pdf'
      },
      socialAuditReport: {
        data: socialAuditReport?.data || null,
        name: socialAuditReport?.name || null,
        mimeType: socialAuditReport?.mimeType || 'application/pdf'
      },
      displayOrder: displayOrder || 999
    };

    let savedProject;

    if (id) {
      savedProject = await Development.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
      if (!savedProject) {
        return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
      }
    } else {
      const newProject = new Development(payload);
      savedProject = await newProject.save();
    }

    return NextResponse.json(savedProject, { status: id ? 200 : 201 });
  } catch (error) {
    console.error('API POST/PUT Error:', error);
    return NextResponse.json({ message: 'Failed to process development project.' }, { status: 500 });
  }
}

export async function GET(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const scheme = searchParams.get('scheme');
    const ward = searchParams.get('ward');
    const status = searchParams.get('status');

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid project ID format.' }, { status: 400 });
      }
      const project = await Development.findById(id);
      return NextResponse.json(project || [], { status: 200 });
    }

    let query = {};
    if (scheme) query.scheme = scheme;
    if (ward) query.wardNo = parseInt(ward);
    if (status) query.status = status;

    const projects = await Development.find(query).sort({ startDate: -1, displayOrder: 1 });
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ message: 'Failed to fetch development projects.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  await connectDB();

  try {
    const data = await request.json().catch(() => ({}));
    const { id } = data;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'A valid ID is required for deletion.' }, { status: 400 });
    }

    const deletedProject = await Development.findByIdAndDelete(id);

    if (!deletedProject) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Development project deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({ message: 'Failed to delete development project.' }, { status: 500 });
  }
}
