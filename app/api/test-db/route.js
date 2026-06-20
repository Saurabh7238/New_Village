import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const dbStatus = {
      timestamp: new Date().toISOString(),
      mongooseConnected: mongoose.connection.readyState === 1,
      mongooseState: mongoose.connection.readyState,
      states: {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      }
    };

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        error: "MONGODB_URI not set in environment variables",
        ...dbStatus
      });
    }

    // Try to connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Try a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    return NextResponse.json({
      success: true,
      ...dbStatus,
      mongooseState_text: dbStatus.states[dbStatus.mongooseState],
      collections: collectionNames,
      hasVoterDataCollection: collectionNames.includes("voterdatas"),
      message: "Database connection check"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
    }, { status: 500 });
  }
}
