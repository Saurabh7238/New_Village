// Fetch local /api/weather to validate the route
const url = 'http://localhost:3000/api/weather';
(async () => {
  try {
    const r = await fetch(url);
    const t = await r.text();
    console.log('LOCAL STATUS', r.status);
    console.log(t);
    process.exit(0);
  } catch (e) {
    console.error('LOCAL ERR', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
