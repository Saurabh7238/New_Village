import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import Fund from "@/models/Fund";

export async function GET(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Valid fund ID is required." }, { status: 400 });
    }

    const record = await Fund.findById(id).select(
      "documentData documentName documentMimeType schemeName"
    );

    if (!record?.documentData) {
      return NextResponse.json({ message: "No document found for this fund record." }, { status: 404 });
    }

    return NextResponse.json(
      {
        documentData: record.documentData,
        documentName: record.documentName || "fund-document.pdf",
        documentMimeType: record.documentMimeType || "application/pdf",
        schemeName: record.schemeName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Funds document GET error:", error);
    return NextResponse.json({ message: "Failed to fetch fund document." }, { status: 500 });
  }
}