import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { LocationNotice } from '@/components/location-notice';
import { Button, Chip, Muted, Notice } from '@/components/ui';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import {
  bearingDegrees,
  compassWord,
  distanceLabel,
  distanceMeters,
  spokenDistance,
  walkMinutes,
  type LatLng,
} from '@/lib/geo';
import { CATEGORIES, MissingKeyError, priceLabel, searchNearby, type CategoryId, type Place } from '@/lib/places';
import { say } from '@/lib/speech';
import { useUserLocation } from '@/state/location';

export default function MapScreen() {
  const { coords, usingDemoSpot } = useUserLocation();
  const [categoryId, setCategoryId] = useState<CategoryId>('food');
  const [result, setResult] = useState<{ key: string; places: Place[]; error: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const category = CATEGORIES.find((c) => c.id === categoryId)!;

  // Search again when the category changes or the user has moved about a block
  const [searchCenter, setSearchCenter] = useState<LatLng | null>(null);
  if (coords && (!searchCenter || distanceMeters(searchCenter, coords) > 110)) setSearchCenter(coords);

  const requestKey = searchCenter
    ? `${categoryId}|${searchCenter.latitude},${searchCenter.longitude}|${attempt}`
    : null;

  useEffect(() => {
    if (!searchCenter || !requestKey) return;
    let cancelled = false;
    searchNearby(searchCenter, { types: category.types, rank: category.rank, radius: 800 })
      .then((found) => {
        if (cancelled) return;
        setResult({ key: requestKey, places: found, error: null });
        setSelectedId(null);
        if (found.length > 0) {
          mapRef.current?.fitToCoordinates([searchCenter, ...found.map((p) => p.location)], {
            edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
            animated: true,
          });
        }
      })
      .catch((e) => {
        if (cancelled) return;
        const error =
          e instanceof MissingKeyError
            ? e.message
            : 'Could not load places from Google. Check your connection and try again.';
        setResult({ key: requestKey, places: [], error });
      });
    return () => {
      cancelled = true;
    };
  }, [searchCenter, category, requestKey]);

  const places = result?.places ?? [];
  const error = result?.error ?? null;
  const loading = requestKey !== null && result?.key !== requestKey;
  const retry = () => setAttempt((n) => n + 1);

  // Closest first, so the list reads like "what is around me"
  const sorted = coords
    ? [...places].sort((a, b) => distanceMeters(coords, a.location) - distanceMeters(coords, b.location))
    : places;

  function select(place: Place) {
    setSelectedId(place.id);
    mapRef.current?.animateCamera({ center: place.location }, { duration: 400 });
  }

  function speak(place: Place) {
    const parts = [place.name + '.'];
    if (place.summary) parts.push(place.summary);
    if (coords) {
      const m = distanceMeters(coords, place.location);
      const mins = walkMinutes(m);
      parts.push(
        `It is ${spokenDistance(m)} to the ${compassWord(bearingDegrees(coords, place.location))}, about ${mins} ${mins === 1 ? 'minute' : 'minutes'} on foot.`,
      );
    }
    if (place.openNow === true) parts.push('It is open now.');
    if (place.openNow === false) parts.push('It is closed right now.');
    say(parts.join(' '));
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={!usingDemoSpot}
        showsPointsOfInterests={false}
        initialRegion={{
          ...(coords ?? { latitude: 40.7505, longitude: -73.9855 }),
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}>
        {sorted.map((p) => (
          <Marker
            key={`${p.id}-${p.id === selectedId}`}
            coordinate={p.location}
            title={p.name}
            description={p.primaryType}
            pinColor={p.id === selectedId ? Colors.accent : Colors.pin}
            onPress={() => setSelectedId(p.id)}
          />
        ))}
        {usingDemoSpot && coords ? (
          <Marker coordinate={coords} title="You (demo)" tracksViewChanges={false}>
            <View style={styles.meDot} />
          </Marker>
        ) : null}
      </MapView>

      <View style={styles.panel}>
        <ScrollView
          horizontal
          style={{ flexGrow: 0 }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} selected={c.id === categoryId} onPress={() => setCategoryId(c.id)} />
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.list}>
          <LocationNotice />
          {error ? <Notice tone="danger" text={error} action={<Button label="Try again" variant="quiet" onPress={retry} />} /> : null}
          {loading && places.length === 0 ? <ActivityIndicator style={{ marginTop: Spacing.lg }} color={Colors.accent} /> : null}
          {!loading && !error && coords && places.length === 0 ? <Muted>Nothing found within 800 m.</Muted> : null}
          {!coords && !error ? <Muted>Waiting for your location...</Muted> : null}

          {sorted.map((p) => {
            const selected = p.id === selectedId;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                onPress={() => select(p)}
                style={[styles.row, selected && styles.rowSelected]}>
                <Text style={styles.name}>{p.name}</Text>
                <Muted>{metaLine(p)}</Muted>
                {coords ? <Text style={styles.dist}>{distanceLabel(coords, p.location)}</Text> : null}
                {selected ? (
                  <View style={styles.rowButtons}>
                    <Button
                      label="Hear it"
                      icon={{ ios: 'speaker.wave.2.fill', android: 'volume_up' }}
                      variant="primary"
                      style={{ flex: 1 }}
                      onPress={() => speak(p)}
                    />
                    {p.mapsUrl ? (
                      <Button
                        label="Directions"
                        icon={{ ios: 'arrow.triangle.turn.up.right.diamond', android: 'directions' }}
                        style={{ flex: 1 }}
                        onPress={() => void Linking.openURL(p.mapsUrl!)}
                      />
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// "Open · 4.6 stars · Korean restaurant · $$"
function metaLine(p: Place): string {
  const parts: string[] = [];
  if (p.openNow === true) parts.push('Open');
  if (p.openNow === false) parts.push('Closed');
  if (p.rating) parts.push(`${p.rating.toFixed(1)} stars`);
  if (p.primaryType) parts.push(p.primaryType);
  const price = priceLabel(p.priceLevel);
  if (price) parts.push(price);
  return parts.join(' · ') || (p.address ?? '');
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  map: { height: '40%' },
  panel: {
    flex: 1,
    marginTop: -20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: Spacing.md,
  },
  chips: { gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  list: { padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm, paddingBottom: 120 },
  row: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
    padding: Spacing.md,
    gap: 3,
  },
  rowSelected: { borderColor: Colors.accent, borderWidth: 2 },
  name: { fontSize: FontSize.large, fontWeight: '700', color: Colors.text },
  dist: { fontSize: FontSize.small + 1, color: Colors.text, fontWeight: '600' },
  rowButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  meDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    borderWidth: 4,
    borderColor: Colors.card,
  },
});
