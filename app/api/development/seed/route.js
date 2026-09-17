import { NextResponse } from 'next/server';
import Development from '@/models/Development';
import connectDB from '@/lib/dbConnect';
import { CHIUTAHARA_DEVELOPMENT_PROJECTS } from '@/lib/chiutaharaDevelopmentData';

export async function POST(request) {
  await connectDB();

  try {
    const operations = CHIUTAHARA_DEVELOPMENT_PROJECTS.map((project) => ({
      updateOne: {
        filter: {
          title: project.title,
          scheme: project.scheme,
          sanctionedAmount: project.sanctionedAmount,
          displayOrder: project.displayOrder
        },
        update: { $set: project },
        upsert: true
      }
    }));
    await Development.bulkWrite(operations);

    return NextResponse.json(
      {
        message: 'Chiutahara development data imported successfully',
        count: CHIUTAHARA_DEVELOPMENT_PROJECTS.length,
        totalSanctionedAmount: CHIUTAHARA_DEVELOPMENT_PROJECTS.reduce((total, project) => total + project.sanctionedAmount, 0)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Chiutahara development import error:', error);
    return NextResponse.json(
      { message: 'Failed to import Chiutahara development data', error: error.message },
      { status: 500 }
    );
  }
}
