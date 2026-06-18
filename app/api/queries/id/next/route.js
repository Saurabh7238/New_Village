import { NextResponse } from 'next/server';
import QueryCounter from '@/models/QueryCounter';
import connectDB from '@/lib/dbConnect';
import { generateQueryId } from '@/lib/queryDisplay';

export async function GET(request) {
  await connectDB();

  try {
    const counter = await QueryCounter.findByIdAndUpdate(
      'query',
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    const queryId = generateQueryId(counter.count);

    return NextResponse.json({ queryId, counter: counter.count }, { status: 200 });
  } catch (error) {
    console.error('Query ID Generation Error:', error);
    return NextResponse.json(
      { message: 'Failed to generate query ID.' },
      { status: 500 }
    );
  }
}
