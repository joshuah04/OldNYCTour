// Google Maps key comes from .env (EXPO_PUBLIC_ values are bundled into the app)
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Language for place names from Google and for the spoken voice
export const PLACES_LANGUAGE = 'en';
export const SPEECH_LANGUAGE = 'en-US';

// Average walking speed used for "min walk" estimates
export const WALK_METERS_PER_MINUTE = 80;
