import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VisitCounter from "@/models/VisitCounter";

const COUNTER_KEY = "site";
let fallbackCount = 0;

async function getCount() {
  await dbConnect();
  const doc = await VisitCounter.findOne({ key: COUNTER_KEY });
  return doc?.count ?? 0;
}

async function incrementCount() {
  await dbConnect();
  const doc = await VisitCounter.findOneAndUpdate(
    { key: COUNTER_KEY },
    { $inc: { count: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc.count;
}

export async function GET() {
  try {
    const count = await getCount();
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("GET Visit Error:", error);
    return NextResponse.json({ count: fallbackCount }, { status: 200 });
  }
}

export async function POST() {
  try {
    const count = await incrementCount();
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("POST Visit Error:", error);
    fallbackCount += 1;
    return NextResponse.json({ count: fallbackCount }, { status: 200 });
  }
}
