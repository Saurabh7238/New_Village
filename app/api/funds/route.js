import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import Fund from "@/models/Fund";
import { FUND_STATUSES } from "@/lib/fundsDisplay";
import { requireAdminSession } from "@/lib/adminAuth";

function computeBalance(totalAllocation, amountReceived) {
  return (Number(totalAllocation) || 0) - (Number(amountReceived) || 0);
}

function buildPayload(data) {
  const {
    financialYear,
    schemeName,
    totalAllocation,
    amountReceived,
    status,
    workDescription,
    startDate,
    endDate,
    beneficiaryCount,
    documentData,
    documentName,
    documentMimeType,
    removeDocument,
  } = data;

  const total = Number(totalAllocation) || 0;
  const received = Number(amountReceived) || 0;

  const payload = {
    financialYear: String(financialYear).trim(),
    schemeName: String(schemeName).trim(),
    totalAllocation: total,
    amountReceived: received,
    balance: computeBalance(total, received),
    status,
    workDescription: workDescription?.trim() || "",
    beneficiaryCount: Number(beneficiaryCount) || 0,
  };

  if (startDate) payload.startDate = new Date(startDate);
  if (endDate) payload.endDate = new Date(endDate);

  if (removeDocument) {
    payload.documentData = null;
    payload.documentName = null;
    payload.documentMimeType = null;
  } else if (documentData) {
    payload.documentData = documentData;
    payload.documentName = documentName || "fund-document.pdf";
    payload.documentMimeType = documentMimeType || "application/pdf";
  }

  return payload;
}

export async function GET() {
  await connectDB();

  try {
    const funds = await Fund.find({})
      .select("-documentData")
      .sort({ updatedAt: -1 });

    return NextResponse.json(funds, { status: 200 });
  } catch (error) {
    console.error("Funds GET error:", error);
    return NextResponse.json({ message: "Failed to fetch fund records." }, { status: 500 });
  }
}

export async function POST(request) {
  await connectDB();

  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const data = await request.json();
    const { id } = data;

    if (!data.financialYear?.trim() || !data.schemeName?.trim()) {
      return NextResponse.json(
        { message: "Financial year and scheme name are required." },
        { status: 400 }
      );
    }

    if (!data.status || !FUND_STATUSES.includes(data.status)) {
      return NextResponse.json({ message: "Valid status is required." }, { status: 400 });
    }

    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid fund ID format." }, { status: 400 });
    }

    const payload = buildPayload(data);
    let savedItem;

    if (id) {
      savedItem = await Fund.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      }).select("-documentData");

      if (!savedItem) {
        return NextResponse.json({ message: "Fund record not found." }, { status: 404 });
      }
    } else {
      savedItem = await new Fund(payload).save();
      savedItem = savedItem.toObject();
      delete savedItem.documentData;
    }

    return NextResponse.json(savedItem, { status: id ? 200 : 201 });
  } catch (error) {
    console.error("Funds POST error:", error);
    return NextResponse.json({ message: "Failed to save fund record." }, { status: 500 });
  }
}

export async function DELETE(request) {
  await connectDB();

  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await request.json().catch(() => ({}));

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "A valid ID is required for deletion." }, { status: 400 });
    }

    const deletedItem = await Fund.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ message: "Fund record not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Fund record deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Funds DELETE error:", error);
    return NextResponse.json({ message: "Failed to delete fund record." }, { status: 500 });
  }
}