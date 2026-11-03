import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const { default: dbConnect } = await import("../lib/dbConnect.js");
const { default: Infrastructure } = await import("../models/Infrastructure.js");

const placeholderImage = "/images/placeholder.svg";
const facilities = [
  {
    title: "Primary School 1",
    type: "Primary School",
    latitude: 25.7271144,
    longitude: 83.0616855,
  },
  {
    title: "Primary School 2",
    type: "Primary School",
    latitude: 25.7343867,
    longitude: 83.0633991,
  },
  {
    title: "Junior School",
    type: "Primary School",
    latitude: 25.7337461,
    longitude: 83.0708634,
  },
  {
    title: "Panchayat Bhawan",
    type: "Community Hall",
    latitude: 25.7321629,
    longitude: 83.0703672,
  },
  {
    title: "Anganwadi Kendra",
    type: "Anganwadi Center",
    latitude: 25.7343879,
    longitude: 83.0631594,
  },
  {
    title: "Public Toilet",
    type: "Sanitation Unit",
    latitude: 25.7344683,
    longitude: 83.0632037,
  },
];

try {
  await dbConnect();
  for (const facility of facilities) {
    const { title, type, latitude, longitude } = facility;
    const result = await Infrastructure.updateOne(
      {
        type,
        "location.latitude": latitude,
        "location.longitude": longitude,
      },
      {
        $setOnInsert: {
          title,
          type,
          status: "Operational",
          description: "",
          location: {
            latitude,
            longitude,
            address: title,
            landmark: title,
          },
          cost: 0,
          approvedBudget: 0,
          amountSpent: 0,
          completionPercentage: 0,
          fundingScheme: "",
          implementingAgency: "",
          image: placeholderImage,
          details: {},
        },
      },
      { upsert: true },
    );
    console.log(`${result.upsertedCount ? "Added" : "Already present"}: ${title}`);
  }
} finally {
  const mongoose = await import("mongoose");
  await mongoose.default.disconnect();
}
