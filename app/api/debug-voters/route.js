import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VoterData from "@/models/VoterData";

export async function GET(request) {
  try {
    await dbConnect();

    const stats = {
      timestamp: new Date().toISOString(),
      database: "Connected ✅",
    };

    // Count voters by type
    const gramPanchayatCount = await VoterData.countDocuments({ type: "gram-panchayat" });
    const vidhanSabhaCount = await VoterData.countDocuments({ type: "vidhan-sabha" });
    const lokSabhaCount = await VoterData.countDocuments({ type: "lok-sabha" });
    const totalCount = await VoterData.countDocuments({});

    stats.voterCounts = {
      "gram-panchayat": gramPanchayatCount,
      "vidhan-sabha": vidhanSabhaCount,
      "lok-sabha": lokSabhaCount,
      total: totalCount,
    };

    // Get first voter as sample
    if (gramPanchayatCount > 0) {
      const sampleVoter = await VoterData.findOne({ type: "gram-panchayat" });
      stats.sampleVoter = sampleVoter ? sampleVoter.toObject() : null;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({
      error: error.message,
      type: error.constructor.name,
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    let action = null;
    try {
      const body = await request.json();
      action = body.action;
    } catch (e) {
      // JSON parsing failed
    }

    if (action === "migrate") {
      // Fix existing voters without type field - set them to gram-panchayat
      const votersWithoutType = await VoterData.find({ type: { $exists: false } });
      
      let updated = 0;
      for (const voter of votersWithoutType) {
        voter.type = "gram-panchayat";
        await voter.save();
        updated++;
      }

      const gramPanchayatCount = await VoterData.countDocuments({ type: "gram-panchayat" });

      return NextResponse.json({
        message: `Fixed ${updated} voters by adding type field`,
        updated,
        totalGramPanchayatVoters: gramPanchayatCount,
        voters: votersWithoutType.map(v => ({
          id: v._id.toString(),
          name: v.voterName || v.elector_name,
          voterId: v.voterId || v.elector_id,
          type: v.type,
        }))
      });
    }

    // Default: Insert test data
    const deleteResult = await VoterData.deleteMany({ type: "gram-panchayat" });

    const testVoters = [
      {
        type: "gram-panchayat",
        serial_number: 1,
        house_no: "2",
        elector_name: "लल्लू",
        parent_name: "पोलहावन",
        elector_id: "LLGMFP795",
        gender: "पुरुष",
        age: 61,
        voterId: "LLGMFP795",
        voterName: "लल्लू",
        voterGuardianName: "पोलहावन",
        voterGender: "पुरुष",
        voterAge: 61,
        ward: "2",
      },
      {
        type: "gram-panchayat",
        serial_number: 2,
        house_no: "2",
        elector_name: "नौरंगी",
        parent_name: "लल्लू",
        elector_id: "LLGMFP796",
        gender: "महिला",
        age: 59,
        voterId: "LLGMFP796",
        voterName: "नौरंगी",
        voterGuardianName: "लल्लू",
        voterGender: "महिला",
        voterAge: 59,
        ward: "2",
      },
    ];

    const insertResult = await VoterData.insertMany(testVoters);

    const count = await VoterData.countDocuments({ type: "gram-panchayat" });

    return NextResponse.json({
      message: "Test data inserted",
      deleted: deleteResult.deletedCount,
      inserted: insertResult.length,
      totalGramPanchayatVoters: count,
      testData: insertResult.map(doc => ({ ...doc.toObject(), id: doc._id.toString() }))
    });
  } catch (error) {
    console.error("Debug POST error:", error);
    return NextResponse.json({
      error: error.message,
      type: error.constructor.name,
    }, { status: 500 });
  }
}
