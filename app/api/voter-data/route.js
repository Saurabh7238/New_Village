import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";
import { requireAdminSession } from "@/lib/adminAuth";
import { serializeVoter } from "@/lib/voterSerialization";
import { writeAuditLog } from "@/lib/writeAuditLog";

const VALID_TYPES = ["vidhan-sabha", "lok-sabha", "gram-panchayat"];
const VOTER_AUDIT_FIELDS = [
  "type", "voterId", "elector_id", "electorId", "voterName", "electorName",
  "voterGuardianName", "parent_name", "parent_name_en", "parent_name_hi",
  "parentNameEn", "parentNameHi", "voterGender", "gender", "age", "voterAge",
  "voterWardNo", "ward", "voterConstituency", "constituency", "svn_no",
  "serial_number", "house_no", "elector_name", "elector_name_en",
  "elector_name_hi", "electorNameEn", "electorNameHi", "relation_type",
  "relationship", "name", "dateOfBirth",
];

function voterAuditSnapshot(voter) {
  const record = typeof voter.toObject === "function" ? voter.toObject() : voter;
  return {
    _id: record._id.toString(),
    ...Object.fromEntries(VOTER_AUDIT_FIELDS
      .filter((field) => record[field] !== undefined)
      .map((field) => [field, record[field]])),
  };
}

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
    await writeAuditLog({
      session,
      action: "Voter record created",
      entityType: "voter-data",
      entityId: created._id.toString(),
      details: { type, before: null, after: voterAuditSnapshot(created) },
    });
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
      if (deleteIds.length > 500) {
        return NextResponse.json({ error: "Delete at most 500 voters at a time." }, { status: 400 });
      }
      const criteria = {
        type,
        $or: [
          { _id: { $in: deleteIds } },
          { voterId: { $in: deleteIds } },
          { elector_id: { $in: deleteIds } },
          { electorId: { $in: deleteIds } },
        ],
      };

      const recordsBeforeDelete = await VoterData.find(criteria).lean();
      const result = await VoterData.deleteMany(criteria);
      if (result.deletedCount > 0) {
        await writeAuditLog({
          session,
          action: "Voter records deleted",
          entityType: "voter-data",
          details: {
            type,
            count: result.deletedCount,
            before: recordsBeforeDelete.map(voterAuditSnapshot),
            after: [],
          },
        });
      }

      return NextResponse.json({
        message: `${result.deletedCount} item(s) deleted successfully`,
        deletedCount: result.deletedCount,
      });
    }

    const deleted = await VoterData.findOneAndDelete({
      type,
      $or: [
        { _id: singleId },
        { voterId: singleId },
        { elector_id: singleId },
        { electorId: singleId },
      ],
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Item not found or already deleted" },
        { status: 404 }
      );
    }

    await writeAuditLog({
      session,
      action: "Voter record deleted",
      entityType: "voter-data",
      entityId: deleted._id.toString(),
      details: { type, count: 1, before: [voterAuditSnapshot(deleted)], after: [] },
    });
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
    if (Array.isArray(body.ids)) {
      const ids = [...new Set(body.ids.filter((value) => typeof value === "string" && value))];
      const { type, updates } = body;
      if (!VALID_TYPES.includes(type) || !ids.length || ids.length > 500) {
        return NextResponse.json({ error: "Select between 1 and 500 voters of a valid type." }, { status: 400 });
      }
      if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
        return NextResponse.json({ error: "Bulk update fields are required." }, { status: 400 });
      }

      const updateData = {};
      const stringFields = {
        houseNo: "house_no",
        voterGender: "gender",
        voterWardNo: type === "gram-panchayat" ? "ward" : null,
        voterConstituency: type === "gram-panchayat" ? null : "constituency",
      };
      for (const [field, databaseField] of Object.entries(stringFields)) {
        if (databaseField && Object.hasOwn(updates, field) && typeof updates[field] === "string") {
          updateData[databaseField] = updates[field].trim().slice(0, 200);
        }
      }
      if (Object.hasOwn(updates, "voterAge")) {
        if (updates.voterAge === "" || updates.voterAge === null) {
          updateData.age = null;
          updateData.voterAge = null;
        } else {
          const age = Number(updates.voterAge);
          if (!Number.isInteger(age) || age < 0 || age > 130) {
            return NextResponse.json({ error: "Age must be between 0 and 130." }, { status: 400 });
          }
          updateData.age = age;
          updateData.voterAge = age;
        }
      }
      if (Object.hasOwn(updateData, "house_no")) updateData.houseNo = updateData.house_no;
      if (Object.hasOwn(updateData, "gender")) updateData.voterGender = updateData.gender;
      if (Object.hasOwn(updateData, "ward")) updateData.voterWardNo = updateData.ward;
      if (Object.hasOwn(updateData, "constituency")) updateData.voterConstituency = updateData.constituency;
      if (!Object.keys(updateData).length) {
        return NextResponse.json({ error: "Choose at least one field to update." }, { status: 400 });
      }

      const before = await VoterData.find({ _id: { $in: ids }, type }).lean();
      const result = await VoterData.updateMany({ _id: { $in: ids }, type }, { $set: updateData }, { runValidators: true });
      const after = await VoterData.find({ _id: { $in: before.map((voter) => voter._id) }, type }).lean();
      await writeAuditLog({
        session,
        action: "Voter records bulk updated",
        entityType: "voter-data",
        details: {
          type,
          count: result.modifiedCount || 0,
          fields: Object.keys(updateData),
          before: before.map(voterAuditSnapshot),
          after: after.map(voterAuditSnapshot),
        },
      });
      return NextResponse.json({
        success: true,
        matchedCount: result.matchedCount || 0,
        modifiedCount: result.modifiedCount || 0,
      });
    }

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

    const voterIdTrim = typeof voterId === "string" ? voterId.trim() : "";
    const voterNameEn = typeof elector_name_en === "string" ? elector_name_en.trim() : "";
    const voterNameHi = typeof elector_name_hi === "string" ? elector_name_hi.trim() : "";
    const requestedName = typeof voterName === "string" ? voterName.trim() : "";
    const voterNameTrim = requestedName || voterNameEn || voterNameHi;
    const parentNameEn = typeof parent_name_en === "string" ? parent_name_en.trim() : "";
    const parentNameHi = typeof parent_name_hi === "string" ? parent_name_hi.trim() : "";

    if (!voterIdTrim || !voterNameTrim) {
      return NextResponse.json(
        { error: "Voter ID and name are required" },
        { status: 400 }
      );
    }

    const normalizedVoterId = voterIdTrim.toUpperCase();
    const escapedVoterId = normalizedVoterId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const voterIdPattern = { $regex: `^${escapedVoterId}$`, $options: "i" };
    const duplicate = await VoterData.findOne({
      _id: { $ne: id },
      type,
      $or: [
        { elector_id: voterIdPattern },
        { electorId: voterIdPattern },
        { voterId: voterIdPattern },
      ],
    }).select("_id").lean();
    if (duplicate) {
      return NextResponse.json({ error: "Another voter already uses this voter ID." }, { status: 409 });
    }

    const displayName = voterNameEn || voterNameTrim;
    const displayGuardian = parentNameEn || normalizeStr(voterGuardianName) || parentNameHi;
    const updateData = {
      voterId: normalizedVoterId,
      elector_id: normalizedVoterId,
      electorId: normalizedVoterId,
      voterName: displayName.trim(),
      electorName: displayName.trim(),
      voterGuardianName: displayGuardian ? displayGuardian.trim() : "",
      voterGender: voterGender ? String(voterGender).trim() : "",
      name: displayName.trim(),

      // Canonical fields
      svn_no: svnNo !== undefined ? String(svnNo).trim() : normalizedVoterId,
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
      electorNameEn: voterNameEn ? voterNameEn.trim() : "",
      electorNameHi: voterNameHi ? voterNameHi.trim() : "",
      parentNameEn: parentNameEn ? parentNameEn.trim() : "",
      parentNameHi: parentNameHi ? parentNameHi.trim() : "",
    };
    if (body.image !== undefined) updateData.image = body.image || "";
    if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth || "";

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

    const previous = await VoterData.findOne({
      _id: id,
      $or: [{ type }, { type: { $exists: false } }],
    }).lean();
    const updated = await VoterData.findOneAndUpdate({
      _id: id,
      $or: [{ type }, { type: { $exists: false } }],
    }, updateData, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    await writeAuditLog({
      session,
      action: "Voter record updated",
      entityType: "voter-data",
      entityId: updated._id.toString(),
      details: {
        type,
        fields: Object.keys(updateData),
        before: previous ? voterAuditSnapshot(previous) : null,
        after: voterAuditSnapshot(updated),
      },
    });
    return NextResponse.json(serializeVoter(updated, type), { status: 200 });
  } catch (error) {
    console.error("Failed to update voter:", error);
    return NextResponse.json({ error: "Failed to update voter" }, { status: 500 });
  }
}
