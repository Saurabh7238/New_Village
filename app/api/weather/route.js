import { NextResponse } from "next/server";
import { fetchWeather } from "../../../lib/weather";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    const data = await fetchWeather({ lat, lon });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("/api/weather error:", err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || "unknown" }, { status: 500 });
  }
}
