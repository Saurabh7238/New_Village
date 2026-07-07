const CACHE = new Map();
const TTL = 1000 * 60 * 10; // 10 minutes

function cacheKey(lat, lon) {
  return `${lat ?? ""},${lon ?? ""}`;
}

async function fetchFromProvider(lat, lon) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error("Missing OPENWEATHER_API_KEY in environment");

  const q = lat && lon ? `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` : "";
  const url = `https://api.openweathermap.org/data/2.5/weather?${q}&units=metric&appid=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Provider error: ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  return json;
}

function normalize(openWeatherJson) {
  if (!openWeatherJson) return null;
  const { main = {}, weather = [], wind = {}, name } = openWeatherJson;
  const w = weather[0] || {};
  return {
    provider: "openweathermap",
    location: name || null,
    temp: typeof main.temp === "number" ? Math.round(main.temp) : null,
    feels_like: main.feels_like ?? null,
    humidity: main.humidity ?? null,
    wind_speed: wind.speed ?? null,
    description: w.description ?? null,
    icon: w.icon ?? null,
    raw: openWeatherJson,
  };
}

export async function fetchWeather({ lat, lon } = {}) {
  // Fallback coordinates (Lucknow area) used when no coordinates are provided
  const FALLBACK_LAT = "26.8467";
  const FALLBACK_LON = "80.9462";

  const latVal = lat ?? process.env.DEFAULT_LAT ?? FALLBACK_LAT;
  const lonVal = lon ?? process.env.DEFAULT_LON ?? FALLBACK_LON;

  if (!latVal || !lonVal) {
    console.warn("fetchWeather: no coordinates available — using fallback coordinates");
  }

  const key = cacheKey(latVal, lonVal);
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && cached.expires > now) return cached.data;

  const raw = await fetchFromProvider(latVal, lonVal);
  const data = normalize(raw);

  CACHE.set(key, { expires: now + TTL, data });
  return data;
}
