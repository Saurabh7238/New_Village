import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";
import { requireAdminSession } from "@/lib/adminAuth";
import { normalizeVoterImport } from "@/lib/voterImport";

export async function POST(request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    let normalized;
    try {
      normalized = normalizeVoterImport(await request.json());
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Invalid voter import data.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const { voters, duplicateRows, totalRows } = normalized;
    const operations = voters.map((voter) => ({
      updateOne: {
        filter: {
          type: 'gram-panchayat',
          $or: [
            { elector_id: voter.elector_id },
            { electorId: voter.elector_id },
            { voterId: voter.elector_id },
          ],
        },
        update: { $set: voter },
        upsert: true,
      },
    }));
    const result = await VoterData.bulkWrite(operations, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;
    const unchanged = (result.matchedCount || 0) - updated;

    return NextResponse.json(
      {
        success: true,
        inserted,
        updated,
        unchanged,
        skippedDuplicates: duplicateRows,
        total: totalRows,
        message: `Imported ${inserted} new voter(s), updated ${updated}, left ${unchanged} unchanged, and skipped ${duplicateRows} duplicate row(s).`,
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
