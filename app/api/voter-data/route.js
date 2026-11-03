import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";
import { requireAdminSession } from "@/lib/adminAuth";
import { serializeVoter } from "@/lib/voterSerialization";

const VALID_TYPES = ["vidhan-sabha", "lok-sabha", "gram-panchayat"];

export async function GET(request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "vidhan-sabha";

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid voter type" }, { status: 400 });
    }

    const data = await VoterData.find({
      $or: [
        { type: type },
        { type: { $exists: false } },
      ],
    }).exec();

    const mapped = data.map((item) => serializeVoter(item, type));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to fetch voter data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

function normalizeStr(val) {
  return typeof val === "string" ? val.trim() : val;
}

export async function POST(request) {
  await dbConnect();

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      type,
      voterId,
      voterName,
      voterGuardianName,
      voterGender,
      voterAge,
      serialNumber,
      houseNo,
      svnNo,
      relationType,
      relationship,
      voterWardNo,
      voterConstituency,
      image,
      dateOfBirth,
    } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid voter type" }, { status: 400 });
    }

    const voterIdTrim = normalizeStr(voterId);
    const voterNameTrim = normalizeStr(voterName);

    if (!voterIdTrim?.trim() || !voterNameTrim?.trim()) {
      return NextResponse.json(
        { error: "Voter ID and name are required" },
        { status: 400 }
      );
    }

    const record = {
      type,

      // Canonical fields required by UI
      svn_no: svnNo ? String(svnNo).trim() : "",
      serial_number: serialNumber ? String(serialNumber).trim() : "",
      house_no: houseNo ? String(houseNo).trim() : "",
      elector_name: voterNameTrim.trim(),

      parent_name: voterGuardianName ? String(voterGuardianName).trim() : "",
      relation_type: relationType ? String(relationType).trim() : "",
      relationship: relationship ? String(relationship).trim() : "",

      // If relationship (guardian name) is not explicitly provided, fall back to voterGuardianName
      relationship:
        relationship && String(relationship).trim().length > 0
          ? String(relationship).trim()
          : voterGuardianName
            ? String(voterGuardianName).trim()
            : "",

      gender: voterGender ? String(voterGender).trim() : "",


      ...(voterAge !== undefined && voterAge !== null && voterAge !== ""
        ? (() => {
            const parsedAge = Number(voterAge);
            if (Number.isNaN(parsedAge)) return { __ageErr: true };
            return { age: parsedAge };
          })()
        : {}),

      // Backward compatible aliases used by existing UI
      voterId: voterIdTrim.trim(),
      voterName: voterNameTrim.trim(),
      voterGuardianName: voterGuardianName ? String(voterGuardianName).trim() : "",
      voterGender: voterGender ? String(voterGender).trim() : "",
      voterAge:
        voterAge !== undefined && voterAge !== null && voterAge !== ""
          ? Number(voterAge)
          : undefined,
      name: voterNameTrim.trim(),

      image: image || "",
      dateOfBirth: dateOfBirth || "",
    };

    if (record.__ageErr) {
      return NextResponse.json({ error: "Invalid age" }, { status: 400 });
    }
    if (record.age !== undefined) record.voterAge = record.age;

    // Keep backward-compatible alias for guardian name
    if (!record.voterGuardianName && record.relationship) {
      record.voterGuardianName = record.relationship;
    }

    if (type === "gram-panchayat" && voterWardNo) {
      record.voterWardNo = voterWardNo;
      record.ward = voterWardNo;
    }

    if (type !== "gram-panchayat" && voterConstituency) {
      record.voterConstituency = voterConstituency;
      record.constituency = voterConstituency;
    }

    const created = await VoterData.create(record);
    return NextResponse.json(serializeVoter(created, type), { status: 201 });
  } catch (error) {
    console.error("Failed to create voter:", error);
    return NextResponse.json({ error: "Failed to add voter" }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ids, type } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Valid type is required" },
        { status: 400 }
      );
    }

    const deleteIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
    const singleId = id ? String(id) : "";

    if (!singleId && deleteIds.length === 0) {
      return NextResponse.json(
        { error: "ID or IDs are required" },
        { status: 400 }
      );
    }

    if (deleteIds.length > 0) {
      const criteria = {
        type,
        $or: [
          { _id: { $in: deleteIds } },
          { voterId: { $in: deleteIds } },
          { elector_id: { $in: deleteIds } },
          { electorId: { $in: deleteIds } },
        ],
      };

      const result = await VoterData.deleteMany(criteria);

      return NextResponse.json({
        message: `${result.deletedCount} item(s) deleted successfully`,
        deletedCount: result.deletedCount,
      });
    }

    const result = await VoterData.deleteOne({
      type,
      $or: [
        { _id: singleId },
        { voterId: singleId },
        { elector_id: singleId },
        { electorId: singleId },
      ],
    });

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

export async function PUT(request) {
  await dbConnect();

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      id,
      type,
      voterId,
      voterName,
      elector_name_en,
      elector_name_hi,
      voterGuardianName,
      parent_name_en,
      parent_name_hi,
      voterGender,
      voterAge,
      voterWardNo,
      voterConstituency,
      serialNumber,
      houseNo,
      svnNo,
      relationType,
      relationship,
    } = body;

    if (!id || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "ID and valid type are required" },
        { status: 400 }
      );
    }

    const voterIdTrim = normalizeStr(voterId);
    const voterNameEn = normalizeStr(elector_name_en);
    const voterNameHi = normalizeStr(elector_name_hi);
    const voterNameTrim = normalizeStr(voterName) || voterNameEn || voterNameHi;
    const parentNameEn = normalizeStr(parent_name_en);
    const parentNameHi = normalizeStr(parent_name_hi);

    if (!voterIdTrim?.trim() || !voterNameTrim?.trim()) {
      return NextResponse.json(
        { error: "Voter ID and name are required" },
        { status: 400 }
      );
    }

    const displayName = voterNameEn || voterNameTrim;
    const displayGuardian = parentNameEn || normalizeStr(voterGuardianName) || parentNameHi;
    const updateData = {
      voterId: voterIdTrim.trim(),
      elector_id: voterIdTrim.trim(),
      electorId: voterIdTrim.trim(),
      voterName: displayName.trim(),
      voterGuardianName: displayGuardian ? displayGuardian.trim() : "",
      voterGender: voterGender ? String(voterGender).trim() : "",
      name: displayName.trim(),

      // Canonical fields
      svn_no: svnNo !== undefined ? String(svnNo).trim() : voterIdTrim.trim(),
      serial_number: serialNumber ? String(serialNumber).trim() : "",
      house_no: houseNo ? String(houseNo).trim() : "",
      elector_name: displayName.trim(),
      parent_name: displayGuardian ? displayGuardian.trim() : "",
      relation_type: relationType ? String(relationType).trim() : "",
      relationship:
        relationship && String(relationship).trim().length > 0
          ? String(relationship).trim()
          : voterGuardianName
            ? String(voterGuardianName).trim()
            : "",
      gender: voterGender ? String(voterGender).trim() : "",
      elector_name_en: voterNameEn ? voterNameEn.trim() : "",
      elector_name_hi: voterNameHi ? voterNameHi.trim() : "",
      parent_name_en: parentNameEn ? parentNameEn.trim() : "",
      parent_name_hi: parentNameHi ? parentNameHi.trim() : "",
      image: body.image || "",
      dateOfBirth: body.dateOfBirth || "",
    };

    if (voterAge === "") {
      updateData.age = null;
      updateData.voterAge = null;
    } else if (voterAge !== undefined && voterAge !== null) {
      const parsedAge = Number(voterAge);
      if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 130) {
        return NextResponse.json({ error: "Invalid age" }, { status: 400 });
      }
      updateData.age = parsedAge;
      updateData.voterAge = parsedAge;
    }

    if (type === "gram-panchayat") {
      updateData.voterWardNo = voterWardNo ? String(voterWardNo).trim() : "";
      updateData.ward = updateData.voterWardNo;
    }

    if (type !== "gram-panchayat") {
      updateData.voterConstituency = voterConstituency ? String(voterConstituency).trim() : "";
      updateData.constituency = updateData.voterConstituency;
    }

    const updated = await VoterData.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    return NextResponse.json(serializeVoter(updated, type), { status: 200 });
  } catch (error) {
    console.error("Failed to update voter:", error);
    return NextResponse.json({ error: "Failed to update voter" }, { status: 500 });
  }
}
