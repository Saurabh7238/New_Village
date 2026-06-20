import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();

    // Accept both "electors" and "voters" keys
    const voters = body?.electors || body?.voters || [];

    if (!Array.isArray(voters) || voters.length === 0) {
      return NextResponse.json(
        { error: "No voters data found. Use { electors: [...] }" },
        { status: 400 }
      );
    }

    console.log(`Processing ${voters.length} voters...`);

    const bulkData = voters.map((voter, idx) => {
      const electorName =
        voter.elector_name ?? voter.voter_name ?? voter.voterName ?? voter.name ?? "";

      const parentName =
        voter.parent_name ??
        voter.parentName ??
        voter.guardian_name ??
        voter.voterGuardianName ??
        voter.relationship_name ??
        voter.relation_name ??
        "";

      const svnNo =
        voter.SVN ?? voter.Svn ?? voter.svn ?? voter.svn_no ?? voter.svnNo ?? "";

      // Voter ID / EPIC-like identifier (if present in upload). SVN is the expected identifier in this UI,
      // but we store both: elector_id gets SVN fallback.
      const electorId =
        voter.elector_id ??
        voter.voter_id ??
        voter.voterId ??
        voter.electorId ??
        voter["EPIC No."] ??
        svnNo ??
        "";

      const gender = voter.gender ?? voter.voterGender ?? voter.Gender ?? "";

      const ageRaw = voter.age ?? voter.Age ?? voter.voterAge;
      const age =
        ageRaw === "" || ageRaw === null || ageRaw === undefined
          ? null
          : Number.parseInt(ageRaw);

      // House No should come from house_* fields only
      const houseNo =
        voter.house_no ?? voter.houseNo ?? voter.house_number ?? "";

      const serialNum =
        voter.serial_number ??
        voter.serial_no ??
        voter.serialNumber ??
        voter["Serial No."] ??
        voter["Serial Number"] ??
        (idx + 1);

      const wardFromUpload =
        voter.voterWardNo ??
        voter.voter_ward_no ??
        voter.ward_no ??
        voter.ward_no_no ??
        voter.ward ??
        voter.Ward ??
        "";

      // Relationship alias (guardian name label). Example: "Father"/"Husband"/"Mother" may be stored here depending on upload.
      const relationship =
        voter.relationship ??
        voter.relation ??
        voter.relation_name ??
        voter["Relation's Name"] ??
        voter.parent_spouse_name ??
        "";

      // Canonical relation type (father/mother/husband) if provided in upload
      const relationType =
        voter.relation_type ??
        voter.relationType ??
        voter.relationTypeName ??
        voter.relation_type_name ??
        "";


      if (!String(electorName).trim() || !String(electorId).trim()) {
        throw new Error(`Row ${idx + 1}: Missing elector_name or elector_id`);
      }

      const electorNameTrim = String(electorName).trim();
      const electorIdTrim = String(electorId).trim();
      const parentNameTrim = parentName ? String(parentName).trim() : "";
      const genderTrim = gender ? String(gender).trim() : "";
      const houseNoTrim = houseNo ? String(houseNo).trim() : "";
      const wardTrim = wardFromUpload ? String(wardFromUpload).trim() : "";
      const relationTypeTrim = relationType ? String(relationType).trim() : "";

      return {
        type: "gram-panchayat",

        // Canonical fields required by UI
        serial_number: serialNum,
        house_no: houseNoTrim,
        ward: wardTrim || (houseNoTrim ? String(houseNoTrim).trim() : ""),
        elector_name: electorNameTrim,
        parent_name: parentNameTrim,
        // Keep elector_id only as a legacy/alias; UI uses svn_no
        elector_id: electorIdTrim,
        gender: genderTrim,
        age: Number.isNaN(age) ? null : age,

      svn_no: svnNo ? String(svnNo).trim() : "",


        // Relation fields
        relationship: relationship ? String(relationship).trim() : "",
        relation_type: relationTypeTrim,

        // Frontend aliases (lib/voterDisplay.js)
        voterId: electorIdTrim,
        voterName: electorNameTrim,
        voterGuardianName: parentNameTrim,
        voterGender: genderTrim,
        voterAge: Number.isNaN(age) ? null : age,
        voterWardNo: wardTrim || "",

        // Extra aliases
        name: electorNameTrim,
      };
    });

    console.log(`Inserting ${bulkData.length} voters into database...`);

    const result = await VoterData.insertMany(bulkData, { ordered: false });

    const inserted = result.map((doc) => ({
      ...doc.toObject(),
      id: doc._id.toString(),
    }));

    return NextResponse.json(
      {
        success: true,
        inserted: result.length,
        total: voters.length,
        voters: inserted,
        message: `✅ Successfully imported ${result.length} voters`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: `❌ Import failed: ${error.message}`,
      },
      { status: 400 }
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

