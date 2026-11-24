import { WALK_METERS_PER_MINUTE } from './config';

export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_M = 6371000;
const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Straight line distance between two points in meters
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Compass bearing from one point to another, 0 = north, 90 = east
export function bearingDegrees(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Turns a bearing into a word like "northeast"
export function compassWord(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 45) % 8];
}

// Signed difference between two bearings, from -180 to 180 (positive means clockwise)
export function angleDiff(target: number, heading: number): number {
  return ((target - heading + 540) % 360) - 180;
}

// Describes where a target is compared to the way the user is facing
export function relativeDirection(targetBearing: number, heading: number): string {
  const diff = angleDiff(targetBearing, heading);
  const abs = Math.abs(diff);
  if (abs <= 30) return 'straight ahead';
  if (abs >= 150) return 'behind you';
  return diff > 0 ? 'on your right' : 'on your left';
}

// Short label like "350 m" or "1.2 km"
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Distance written out for the voice, like "350 meters" or "1.2 kilometers"
export function spokenDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} meters`;
  return `${(meters / 1000).toFixed(1)} kilometers`;
}

// Walking time in whole minutes, at least 1
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALK_METERS_PER_MINUTE));
}

// Combined label like "350 m north · 4 min walk"
export function distanceLabel(from: LatLng, to: LatLng): string {
  const meters = distanceMeters(from, to);
  const direction = compassWord(bearingDegrees(from, to));
  return `${formatDistance(meters)} ${direction} · ${walkMinutes(meters)} min walk`;
}
