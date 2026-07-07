import { NextResponse } from "next/server";
import { fetchWeather } from "../../../lib/weather";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    // If lat or lon are provided but empty, return 400
    if ((url.searchParams.has("lat") && !lat) || (url.searchParams.has("lon") && !lon)) {
      return NextResponse.json({ success: false, error: "Invalid lat/lon parameters" }, { status: 400 });
    }

    const data = await fetchWeather({ lat, lon });

    // Log which coordinates were used (env/default/fallback may apply)
    const usedCoords = {
      lat: lat ?? process.env.DEFAULT_LAT ?? "fallback",
      lon: lon ?? process.env.DEFAULT_LON ?? "fallback",
    };
    console.info(`/api/weather used coords: ${usedCoords.lat},${usedCoords.lon}`);

    return NextResponse.json({ success: true, data, usedCoords });
  } catch (err) {
    console.error("/api/weather error:", err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || "unknown" }, { status: 500 });
  }
}
