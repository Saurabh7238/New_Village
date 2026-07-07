// Simple script to validate OpenWeather API key by reading .env.local
import fs from 'fs';
import path from 'path';

function readEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/);
  const env = {};
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = readEnvLocal();
const KEY = env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;
if (!KEY) {
  console.error('No OPENWEATHER_API_KEY found in .env.local or environment');
  process.exit(2);
}

const url = `https://api.openweathermap.org/data/2.5/weather?lat=26.8467&lon=80.9462&units=metric&appid=${KEY}`;

(async () => {
  try {
    const r = await fetch(url);
    const t = await r.text();
    console.log('STATUS', r.status);
    console.log(t);
    process.exit(r.ok ? 0 : 1);
  } catch (e) {
    console.error('ERR', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
