import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import Budget from "@/models/Budget";

export async function GET(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Valid budget ID is required." }, { status: 400 });
    }

    const record = await Budget.findById(id).select(
      "documentData documentName documentMimeType schemeName"
    );

    if (!record?.documentData) {
      return NextResponse.json({ message: "No document found for this budget record." }, { status: 404 });
    }

    return NextResponse.json(
      {
        documentData: record.documentData,
        documentName: record.documentName || "budget-document.pdf",
        documentMimeType: record.documentMimeType || "application/pdf",
        schemeName: record.schemeName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Budget document GET error:", error);
    return NextResponse.json({ message: "Failed to fetch budget document." }, { status: 500 });
  }
}
