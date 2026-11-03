import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";
import { requireAdminSession } from "@/lib/adminAuth";
import { analyzeVoterImport } from "@/lib/voterImport";
import { writeAuditLog } from "@/lib/writeAuditLog";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_ERROR_ROWS = 5000;

function voterIdPatterns(ids) {
  return ids.map((id) => new RegExp(
    `^${String(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i"
  ));
}

async function readImportRequest(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_IMPORT_BYTES) throw new Error("Import file exceeds the 10 MB limit.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Import file body is missing.");
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMPORT_BYTES) {
      await reader.cancel();
      throw new Error("Import file exceeds the 10 MB limit.");
    }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Selected file is not valid JSON.");
  }
}

async function findExistingVoterIds(ids) {
  if (!ids.length) return new Set();
  const patterns = voterIdPatterns(ids);
  const existing = await VoterData.find({
    type: "gram-panchayat",
    $or: [
      { elector_id: { $in: patterns } },
      { electorId: { $in: patterns } },
      { voterId: { $in: patterns } },
    ],
  }).select("elector_id electorId voterId").lean();
  return new Set(existing.flatMap((voter) =>
    [voter.elector_id, voter.electorId, voter.voterId]
      .filter(Boolean)
      .map((id) => String(id).trim().toUpperCase())
  ));
}

export async function POST(request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    let requestBody;
    try {
      requestBody = await readImportRequest(request);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Invalid voter import data.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const isPreview = requestBody?.mode === "preview";
    const payload = isPreview ? requestBody.payload : requestBody;
    const analysis = analyzeVoterImport(payload);
    const { voters, duplicateRows, totalRows, invalidRows, missingFields } = analysis;
    if (totalRows === 0 || (voters.length === 0 && !isPreview)) {
      return NextResponse.json({
        success: false,
        error: invalidRows[0]?.issues?.[0] || "No valid unique voter records to import.",
        ...(isPreview && {
          preview: {
            totalRows,
            validRows: 0,
            invalidRows: invalidRows.length,
            duplicateRows,
            missingFields,
            errors: invalidRows.slice(0, MAX_ERROR_ROWS),
          },
        }),
      }, { status: 400 });
    }

    const existingIds = await findExistingVoterIds(voters.map((voter) => voter.elector_id));
    const existingCount = voters.filter((voter) => existingIds.has(voter.elector_id)).length;
    if (isPreview) {
      return NextResponse.json({
        success: true,
        preview: {
          totalRows,
          validRows: voters.length,
          invalidRows: invalidRows.length,
          duplicateRows,
          existingCount,
          newCount: voters.length - existingCount,
          missingFields,
          errors: invalidRows.slice(0, MAX_ERROR_ROWS),
          errorsTruncated: invalidRows.length > MAX_ERROR_ROWS,
        },
      });
    }

    const operations = voters.map((voter) => ({
      updateOne: {
        filter: {
          type: 'gram-panchayat',
          $and: [{
            $or: voterIdPatterns([voter.elector_id]).flatMap((pattern) => [
              { elector_id: pattern },
              { electorId: pattern },
              { voterId: pattern },
            ]),
          }],
        },
        update: { $set: voter },
        upsert: true,
      },
    }));
    const result = await VoterData.bulkWrite(operations, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;
    const unchanged = (result.matchedCount || 0) - updated;
    await writeAuditLog({
      session,
      action: "Voter records imported",
      entityType: "voter-data",
      details: {
        type: "gram-panchayat",
        imported: inserted,
        updated,
        unchanged,
        invalidRows: invalidRows.length,
        duplicateRows,
      },
    });

    return NextResponse.json(
      {
        success: true,
        inserted,
        updated,
        unchanged,
        skippedDuplicates: duplicateRows,
        skippedInvalidRows: invalidRows.length,
        missingFields,
        rowErrors: invalidRows.slice(0, MAX_ERROR_ROWS),
        errorsTruncated: invalidRows.length > MAX_ERROR_ROWS,
        total: totalRows,
        message: `Imported ${inserted} new voter(s), updated ${updated}, left ${unchanged} unchanged, skipped ${duplicateRows} duplicate row(s), and skipped ${invalidRows.length} invalid row(s).`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk voter import failed.");
    return NextResponse.json(
      {
        success: false,
        error: 'Bulk voter import failed. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const count = await VoterData.countDocuments({ type: "gram-panchayat" });
    return NextResponse.json({
      success: true,
      gramPanchayatVotersCount: count,
      message: `Total gram-panchayat voters: ${count}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
