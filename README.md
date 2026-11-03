# Eeny Meeny Eats

A food discovery web app for exploring nearby restaurants and cafes. When you still can't decide, the randomizer picks for you.

> **Status:** nearby search and typed-area geocoding use Geoapify (OpenStreetMap data), cached in Supabase. "Report a problem" saves to Supabase `reports`. Google ratings are skipped for now: `rating.js` is a mock and the rating UI stays hidden while places have no rating. Server settings (country filter, radius, result limit, cache TTL) live in `netlify/lib/config.js`.

## User flow

1. **Share your location**, or type a city or area if you deny location access.
2. **Explore** nearby places on a map and in a scrollable list. Filter by cuisine, distance, price, and open now, and sort by rating or distance.
3. **Tap a place** to see its details: name, cuisine, Google star rating and count, distance, address, and a link to directions.
4. **Still can't decide?** Tap the randomizer. It picks only from places that match your current filters.
5. **After a pick**, accept it, re-roll, or go back to exploring.

## Tech stack

| Layer      | Tech                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| Frontend   | Vue 3 + Vite (plain JavaScript), Vue Router, Pinia                        |
| Map        | Leaflet with OpenStreetMap tiles                                         |
| PWA        | vite-plugin-pwa (installable on phones)                                  |
| Backend    | Netlify Functions (Node.js, plain JS)                                    |
| Database   | Supabase (Postgres) via `@supabase/supabase-js`                          |
| Place data | Geoapify Places API (nearby search), Google Places API (New) for ratings |
| Hosting    | Netlify                                                                  |

External APIs are called **only** from Netlify Functions, never from the browser, so API keys stay server-side.

## Project structure

```
netlify/functions/   nearby.js, geocode.js, rating.js, report.js (served at /api/*)
netlify/lib/         shared server code and settings (config.js)
public/              favicon and placeholder PWA icons
src/
  components/        MapView, PlaceList, PlaceCard, FilterPanel, SortControl, RandomizerButton
  router/            route definitions
  services/api.js    frontend helpers that call /api/*
  stores/            Pinia: location, filters, places (filteredPlaces feeds the list, map, and randomizer)
  utils/format.js    display helpers
  views/             HomeView, ExploreView, PlaceView, RandomPickView
supabase/schema.sql  starter tables: places_cache, ratings_cache, reports
netlify.toml         build, functions, /api redirect, SPA fallback
```

## Local setup

Requirements: Node.js 20 or newer.

```bash
# 1. Install dependencies (includes the Netlify CLI as a dev dependency)
npm install

# 2. Create your local env file and fill in the keys
cp .env.example .env

# 3. Run the app and the functions together
npx netlify dev
```

Open **http://localhost:8888**. Use this port rather than Vite's 5173: `netlify dev` serves the functions and the `/api/*` redirect alongside the Vite dev server.

`npm run dev` starts only Vite, so `/api/*` calls will fail. It's fine for pure UI work.

### Environment variables

Only variables prefixed with `VITE_` are bundled into the browser. `SUPABASE_SERVICE_ROLE_KEY`, `GEOAPIFY_API_KEY`, and `GOOGLE_PLACES_API_KEY` must stay server-side (Netlify Functions only). See `.env.example`.

### Database

Create a Supabase project, then run `supabase/schema.sql` in the SQL editor. Row Level Security is enabled with no policies, so only the service role (used by functions) can access the tables.

## Deploy to Netlify

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project** and select the repo. The build settings come from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. Under **Site configuration → Environment variables**, add every variable from `.env.example`.
4. Deploy. Later pushes to the main branch deploy automatically.

You can also deploy from the CLI:

```bash
npx netlify login
npx netlify init      # link or create a site
npx netlify deploy --build          # draft deploy
npx netlify deploy --build --prod   # production
```

## Next steps

- Optional: implement `rating.js` with Google Places API (New) for ratings. Check Google's terms first: they limit caching and showing Places data on non-Google maps.
- Replace the placeholder PWA icons and theme color.
