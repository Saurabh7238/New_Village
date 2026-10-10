import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/dbConnect";
import Budget from "@/models/Budget";
import { BUDGET_STATUSES } from "@/lib/budgetDisplay";
import { requireAdminSession } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/writeAuditLog";

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
    payload.documentName = documentName || "budget-document.pdf";
    payload.documentMimeType = documentMimeType || "application/pdf";
  }

  return payload;
}

export async function GET() {
  await connectDB();

  try {
    const budgets = await Budget.find({})
      .select("-documentData")
      .sort({ updatedAt: -1 });

    return NextResponse.json(budgets, { status: 200 });
  } catch (error) {
    console.error("Budget GET error:", error);
    return NextResponse.json({ message: "Failed to fetch budget records." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  await connectDB();

  try {
    const data = await request.json();
    const { id } = data;

    if (!data.financialYear?.trim() || !data.schemeName?.trim()) {
      return NextResponse.json(
        { message: "Financial year and scheme name are required." },
        { status: 400 }
      );
    }

    if (!data.status || !BUDGET_STATUSES.includes(data.status)) {
      return NextResponse.json({ message: "Valid status is required." }, { status: 400 });
    }

    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid budget ID format." }, { status: 400 });
    }

    const payload = buildPayload(data);
    let savedItem;

    if (id) {
      savedItem = await Budget.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      }).select("-documentData");

      if (!savedItem) {
        return NextResponse.json({ message: "Budget record not found." }, { status: 404 });
      }
      await writeAuditLog({ session: await requireAdminSession(), action: "Budget updated", details: { budgetId: savedItem._id.toString(), schemeName: savedItem.schemeName } });
    } else {
      savedItem = await new Budget(payload).save();
      await writeAuditLog({ session: await requireAdminSession(), action: "Budget created", details: { budgetId: savedItem._id.toString(), schemeName: savedItem.schemeName } });
      savedItem = savedItem.toObject();
      delete savedItem.documentData;
    }

    return NextResponse.json(savedItem, { status: id ? 200 : 201 });
  } catch (error) {
    console.error("Budget POST error:", error);
    return NextResponse.json({ message: "Failed to save budget record." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  await connectDB();

  try {
    const { id } = await request.json().catch(() => ({}));

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "A valid ID is required for deletion." }, { status: 400 });
    }

    const deletedItem = await Budget.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ message: "Budget record not found." }, { status: 404 });
    }
    await writeAuditLog({ session: await requireAdminSession(), action: "Budget deleted", details: { budgetId: deletedItem._id.toString(), schemeName: deletedItem.schemeName } });

    return NextResponse.json({ message: "Budget record deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Budget DELETE error:", error);
    return NextResponse.json({ message: "Failed to delete budget record." }, { status: 500 });
  }
}
