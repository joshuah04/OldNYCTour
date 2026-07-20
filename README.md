# 뉴욕 나들이 (Oldtour)

An accessible, Korean-first **personal NYC tour guide** for senior adults — built for
Korean seniors in New Jersey who want to visit New York but don't know where to start.

The app uses the phone's location to **talk to them** about where they are and what to
see, and helps them find **nearby restaurants and landmarks** with walking directions.

## Features

- **📍 Live location tracking** — follows the user as they walk (browser Geolocation).
- **🗣️ Voice + text tour guide** — a warm Korean AI guide (Claude via Vercel AI Gateway)
  describes the surroundings; answers are read aloud (Korean text-to-speech) and can be
  asked by voice (speech-to-text) or typed.
- **🗺️ Map view** — interactive map centered on the user (Google Maps Embed).
- **🍜 Nearby restaurants & 🏛️ landmarks** — Google Places, sorted by distance, with
  direction, walking distance, rating, open-now status, and one-tap directions.
- **♿ Senior accessibility** — large adjustable fonts, high contrast, big touch targets,
  simple Korean navigation, pinch-zoom allowed, reduced-motion aware.
- **📱 Installable PWA** — add to the phone home screen.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys (see below)
npm run dev
```

Open http://localhost:3000. The app runs **without any keys** (with graceful
fallbacks); add keys to enable the AI guide and place search.

## Environment variables

See `.env.example`. All are optional for local UI testing but needed for full function:

| Variable | Used for | Where |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | AI tour guide | Server. Auto-provided on Vercel via OIDC. |
| `GOOGLE_MAPS_API_KEY` | Places (New) + Geocoding | Server only. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map view (Embed API) | Client. Restrict by HTTP referrer. |

Enable these Google APIs: **Places API (New)**, **Geocoding API**, **Maps Embed API**.

## Architecture

- **Next.js 16 (App Router) + React 19 + Tailwind 4**, deployed on Vercel.
- Server routes keep the Google/AI keys off the client:
  - `POST /api/guide` — AI narration, grounded on location + nearby places.
  - `POST /api/places` — nearby restaurants / landmarks.
  - `GET  /api/geocode` — reverse-geocode coordinates to a Korean label.
- `src/hooks/useGeolocation`, `useSpeech` — live location, Korean TTS/STT.
- `src/components/SettingsProvider` — persisted font size & voice preferences.

## Deploy

```bash
npx vercel        # preview
npx vercel --prod # production
```

Add the environment variables in the Vercel project settings (or `vercel env add`).

## Notes & next ideas

- Voice in/out uses the browser Web Speech API — best support is on Safari (iOS) and
  Chrome. Korean voice quality depends on the device's installed voices.
- Possible next steps: guided walking routes between landmarks, saved favorites,
  a "call my family" safety button, subway directions, and offline caching.
