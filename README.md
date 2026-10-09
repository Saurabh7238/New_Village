# Gram Panchayat Chiutahara

Next.js app for village portal features (notifications, infrastructure, voters, gallery, admin).

## Setup (first time)

```bash
npm install
copy .env.example .env.local
```

Edit `.env.local` with your MongoDB Atlas URI and a `NEXTAUTH_SECRET` (32+ random characters).

### Village map

The `/map` page uses the Google Maps JavaScript API. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` and in deployment environment variables. Enable the Maps JavaScript API, restrict the key to the site's HTTP referrers, and review Google Maps Platform billing and pricing before use. The displayed Chiutahara polygon is illustrative only and must be replaced with verified boundary coordinates for official use.

### Weather feature environment variables

The project includes a small weather badge that depends on OpenWeatherMap. Add the following to `.env.local`:

```
OPENWEATHER_API_KEY=your_openweather_api_key
DEFAULT_LAT=26.8467
DEFAULT_LON=80.9462
```

`DEFAULT_LAT` and `DEFAULT_LON` are optional but used as a fallback when the client does not provide coordinates.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chatbot support tickets

Signed-in residents can submit a chatbot request, then use the confirmation card's **Track this ticket** link or the **Copy ticket** action. Chatbot tickets are saved separately from formal grievance queries and can be checked at `/chat/track`. Admins can review and update their statuses from **Admin Panel → Chatbot Support Tickets**. Ticket status changes are stored in the configured MongoDB database; no paid chatbot or ticketing service is required.

## Push to GitHub (safe workflow)

1. **Do not commit** MongoDB files under `data/` (only `data/*.json` seed files belong in Git).
2. After you change code:

```bash
git add .
git status
npm run verify
git commit -m "describe your change"
git push
```

`npm run verify` runs lint + production build so pushes are less likely to fail CI.

Repository: [Saurabh7238/my-village](https://github.com/Saurabh7238/my-village)

## Deploy (Vercel)

Connect the GitHub repo on [Vercel](https://vercel.com). Add the same variables as `.env.example` in **Project → Settings → Environment Variables**. Without `MONGODB_URI` and `NEXTAUTH_SECRET`, deploy checks may show a red X even when `git push` succeeds.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run verify` | Lint + build (run before push) |
