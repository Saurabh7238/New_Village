import test from "node:test";
import assert from "node:assert/strict";
import { fetchWeather } from "../lib/weather.js";

test("fetchWeather returns normalized data and uses cache", async () => {
  process.env.OPENWEATHER_API_KEY = "testkey";
  process.env.DEFAULT_LAT = "26.8";
  process.env.DEFAULT_LON = "80.9";

  let calls = 0;
  const mockJson = {
    name: "TestTown",
    main: { temp: 23.4, feels_like: 24.1, humidity: 56 },
    weather: [{ description: "clear sky", icon: "01d" }],
    wind: { speed: 3.2 },
  };

  globalThis.fetch = async (url) => {
    calls++;
    return {
      ok: true,
      json: async () => mockJson,
      text: async () => JSON.stringify(mockJson),
    };
  };

  const first = await fetchWeather({});
  assert.equal(first.provider, "openweathermap");
  assert.equal(first.location, "TestTown");
  assert.equal(first.temp, 23);
  assert.equal(first.description, "clear sky");

  const second = await fetchWeather({});
  assert.equal(calls, 1, "fetch should be called only once due to cache");
  assert.deepEqual(second, first);
});
