import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";

const VALID_TYPES = ["vidhan-sabha", "lok-sabha", "gram-panchayat"];

export async function GET(request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "vidhan-sabha";

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid voter type" }, { status: 400 });
    }

    const data = await VoterData.find({ type }).exec();

    const mapped = data.map((item) => ({
      ...item.toObject(),
      id: item._id.toString(),
      _id: item._id.toString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to fetch voter data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const {
      type,
      voterId,
      voterName,
      voterGuardianName,
      voterGender,
      voterAge,
      image,
      voterWardNo,
      voterConstituency,
    } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid voter type" }, { status: 400 });
    }

    if (!voterId?.trim() || !voterName?.trim()) {
      return NextResponse.json(
        { error: "Voter ID and name are required" },
        { status: 400 }
      );
    }

    const record = {
      type,
      voterId: voterId.trim(),
      voterName: voterName.trim(),
      voterGuardianName: voterGuardianName?.trim() || "",
      voterGender: voterGender || "",
      image: image || "",
      name: voterName.trim(),
    };

    if (voterAge !== undefined && voterAge !== null && voterAge !== "") {
      const parsedAge = Number(voterAge);
      if (Number.isNaN(parsedAge)) {
        return NextResponse.json({ error: "Invalid age" }, { status: 400 });
      }
      record.age = parsedAge;
      record.voterAge = parsedAge;
    }

    if (type === "gram-panchayat" && voterWardNo) {
      record.voterWardNo = voterWardNo;
      record.ward = voterWardNo;
    }

    if (type !== "gram-panchayat" && voterConstituency) {
      record.voterConstituency = voterConstituency;
      record.constituency = voterConstituency;
      record.elector_name = voterName.trim();
      record.guardian_name = voterGuardianName?.trim() || "";
    }

    const created = await VoterData.create(record);
    const mapped = {
      ...created.toObject(),
      id: created._id.toString(),
      _id: created._id.toString(),
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (error) {
    console.error("Failed to create voter:", error);
    return NextResponse.json({ error: "Failed to add voter" }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { id, type } = body;

    if (!id || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "ID and valid type are required" },
        { status: 400 }
      );
    }

    const result = await VoterData.deleteOne({ _id: id, type });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Item not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Failed to delete voter:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
