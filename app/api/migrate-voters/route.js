import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";

export async function POST(request) {
  try {
    await dbConnect();

    // Find all documents that have an "electors" array field (bulk imported with wrong format)
    const docsWithArrays = await VoterData.find({ electors: { $exists: true, $type: "array" } });

    console.log(`Found ${docsWithArrays.length} documents with embedded arrays`);

    let migratedCount = 0;
    const newVoters = [];

    // For each document with an array, flatten it into individual records
    for (const doc of docsWithArrays) {
      const electors = doc.electors || [];
      
      for (const elector of electors) {
        const newVoter = {
          type: "gram-panchayat",
          serial_number: elector.serial_number,
          house_no: elector.house_no || "",
          elector_name: elector.elector_name || "",
          parent_name: elector.parent_name || "",
          elector_id: elector.elector_id || "",
          gender: elector.gender || "",
          age: elector.age ? parseInt(elector.age) : null,
          voterId: elector.elector_id || "",
          voterName: elector.elector_name || "",
          voterGuardianName: elector.parent_name || "",
          voterGender: elector.gender || "",
          voterAge: elector.age ? parseInt(elector.age) : null,
          ward: elector.house_no || "",
          name: elector.elector_name || "",
        };
        
        newVoters.push(newVoter);
      }

      // Delete the old document with the array
      await VoterData.deleteOne({ _id: doc._id });
      migratedCount++;
    }

    // Insert all flattened voters
    let inserted = 0;
    if (newVoters.length > 0) {
      const result = await VoterData.insertMany(newVoters, { ordered: false });
      inserted = result.length;
    }

    const gramPanchayatCount = await VoterData.countDocuments({ type: "gram-panchayat" });
    const totalCount = await VoterData.countDocuments({});

    return NextResponse.json({
      success: true,
      message: `Migration complete: Flattened ${migratedCount} documents, created ${inserted} individual voter records`,
      deleted: migratedCount,
      inserted,
      totalVoters: totalCount,
      gramPanchayatVoters: gramPanchayatCount,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({
      error: error.message,
      type: error.constructor.name,
    }, { status: 500 });
  }
}
