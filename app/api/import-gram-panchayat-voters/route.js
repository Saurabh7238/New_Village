import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";

function normalizeRecord(r, idx) {
  const serial_no = r?.serial_no ?? idx + 1;
  const house_no = r?.house_no ?? "";
  const name = r?.name ?? "";
  const voterId = r?.voter_id ?? "";
  const gender = r?.gender ?? "";
  const age = r?.age ?? "";

  return {
    type: "gram-panchayat",
    serial_no,
    house_no,
    name,
    voterId,
    gender,
    age,
    // Map to model field(s)
    voterId,
    // since schema uses `name` and `ward`, store ward as house_no
    ward: house_no ? String(house_no) : "",
  };
}

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const voters = Array.isArray(body?.voters) ? body.voters : null;

    if (!voters) {
      return NextResponse.json(
        { error: "Request body must be { voters: [...] }" },
        { status: 400 }
      );
    }

    const normalized = voters.map((r, idx) => normalizeRecord(r, idx));

    // Basic validation
    for (let i = 0; i < normalized.length; i++) {
      const v = normalized[i];
      if (!v.voterId || !String(v.voterId).trim()) {
        return NextResponse.json(
          { error: `Missing voter_id at index ${i}` },
          { status: 400 }
        );
      }
      if (!v.name || !String(v.name).trim()) {
        return NextResponse.json(
          { error: `Missing name at index ${i}` },
          { status: 400 }
        );
      }
    }

    // Insert
    const created = await VoterData.insertMany(normalized, { ordered: false });

    const mapped = created.map((doc) => ({
      ...doc.toObject(),
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }));

    return NextResponse.json({ inserted: mapped.length, voters: mapped });
  } catch (error) {
    console.error("Failed to import voters:", error);
    return NextResponse.json(
      { error: "Failed to import voters" },
      { status: 500 }
    );
  }
}

