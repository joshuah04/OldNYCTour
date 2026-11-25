# NYC Tour

A voice first walking guide for New York, built for Korean and Korean American visitors. This is the demo build: location, Google Maps places, a preset Midtown trip and spoken answers. The AI features (reading photos, answering spoken questions) come later.

## What is in the demo

* **Home**: where you are, your current trip stop, and a big "Where am I?" button that answers out loud.
* **Trip**: a map of the preset "Midtown half day" walk with the current and next stop open and the rest folded. The app speaks a stop's story when you walk up to it.
* **Map**: nearby Restaurants, Cafes, bakeries & desserts, and Buildings from Google, sorted by distance. Tap one to hear it or open directions.
* **Camera**: "What's this?" guesses the landmark you are pointing at from GPS and the compass. "Where am I?" says your street, the closest landmark and your next stop.
* **Profile**: blank for now.

If you are far from Manhattan, the app offers a demo mode that pretends you are standing in Koreatown.

## Run it on an iPhone

1. Install **Expo Go** from the App Store.
2. On your computer, install Node.js, then in this folder run:

   ```bash
   npm install
   cp .env.example .env
   ```

3. Open `.env` and paste your Google Maps Platform key after `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=`. The key needs **Places API (New)** enabled. `.env` is ignored by git, so the key is never committed.
4. Start the app and scan the QR code with the iPhone camera:

   ```bash
   npx expo start
   ```

   If the phone and computer are on different networks, use `npx expo start --tunnel`.

## Google costs

Each list on the Map tab and each camera answer is one Nearby Search request. The fields the app asks for (ratings, open now, short descriptions) are billed at Google's highest Nearby Search tier, which has about 1,000 free requests a month. Results are cached for 10 minutes and only refreshed after you walk about a block, so a demo day uses a few dozen requests. To be safe, set a daily quota for Places API (New) in Google Cloud Console under APIs & Services, Quotas.

The key is bundled inside the app, so restrict it in Google Cloud Console to the Places API (New) before sharing a build.

## Checks

```bash
npm run typecheck
npm run lint
```

## Project layout

* `src/app`: the five tab screens (Expo Router native tabs)
* `src/lib`: geo math, Google Places, speech and the text the app speaks
* `src/state`: live location and trip progress
* `src/data/trip.ts`: the preset Midtown trip
