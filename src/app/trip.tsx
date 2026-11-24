import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationNotice } from '@/components/location-notice';
import { Button, Card, Muted } from '@/components/ui';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import type { Stop } from '@/data/trip';
import { bearingDegrees, compassWord, distanceLabel, distanceMeters, spokenDistance, walkMinutes, type LatLng } from '@/lib/geo';
import { say } from '@/lib/speech';
import { useUserLocation } from '@/state/location';
import { useTrip } from '@/state/trip';

type StopState = 'done' | 'now' | 'later';

export default function TripScreen() {
  const insets = useSafeAreaInsets();
  const { coords, usingDemoSpot } = useUserLocation();
  const { trip, currentIndex, current, next, finished, completeCurrent, goTo, restart } = useTrip();
  const [showAll, setShowAll] = useState(false);
  const mapRef = useRef<MapView>(null);

  const stateOf = (i: number): StopState => (i < currentIndex ? 'done' : i === currentIndex ? 'now' : 'later');
  const doneCount = Math.min(currentIndex, trip.stops.length);
  const rest = trip.stops.slice(currentIndex + 2);

  // Frame the whole route once the map is ready
  function fitRoute() {
    mapRef.current?.fitToCoordinates(
      trip.stops.map((s) => s.location),
      { edgePadding: { top: insets.top + 40, right: 40, bottom: 60, left: 40 }, animated: false },
    );
  }

  // Move the map to the current stop when it changes
  useEffect(() => {
    if (!current) return;
    mapRef.current?.animateCamera({ center: current.location }, { duration: 500 });
  }, [current]);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onMapReady={fitRoute}
        showsUserLocation={!usingDemoSpot}
        showsPointsOfInterests={false}
        initialRegion={{ ...trip.stops[1].location, latitudeDelta: 0.014, longitudeDelta: 0.014 }}>
        <Polyline
          coordinates={trip.stops.map((s) => s.location)}
          strokeColor={Colors.accent}
          strokeWidth={4}
          lineDashPattern={[8, 7]}
        />
        {trip.stops.map((s, i) => (
          <Marker
            key={`${s.id}-${stateOf(i)}`}
            coordinate={s.location}
            title={s.name}
            description={s.time}
            onPress={() => goTo(i)}
            tracksViewChanges={false}>
            <StopPin n={i + 1} state={stateOf(i)} />
          </Marker>
        ))}
        {usingDemoSpot && coords ? (
          <Marker coordinate={coords} title="You (demo)" tracksViewChanges={false}>
            <View style={styles.meDot} />
          </Marker>
        ) : null}
      </MapView>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <View style={styles.handle} />
        <View style={styles.headRow}>
          <Text style={styles.tripTitle}>{trip.title}</Text>
          <Muted>{finished ? 'Finished' : `Stop ${currentIndex + 1} of ${trip.stops.length}`}</Muted>
        </View>

        <LocationNotice />

        {finished ? (
          <Card>
            <Text style={styles.stopName}>You finished the trip</Text>
            <Muted>Nice walk! You can start it again from the first stop.</Muted>
            <Button label="Start again" icon={{ ios: 'arrow.counterclockwise', android: 'restart_alt' }} onPress={restart} />
          </Card>
        ) : null}

        {current ? (
          <Card style={styles.nowCard}>
            <Text style={styles.kicker}>NOW · {current.time}</Text>
            <Text style={styles.stopName}>{current.name}</Text>
            <Text style={styles.body}>{stopLine(current, coords)}</Text>
            <View style={styles.btnRow}>
              <Button
                label="Hear about it"
                icon={{ ios: 'speaker.wave.2.fill', android: 'volume_up' }}
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => say(current.story)}
              />
              <Button
                label="Done"
                icon={{ ios: 'checkmark', android: 'check' }}
                style={{ flex: 1 }}
                onPress={() => {
                  completeCurrent();
                  if (next && coords) say(nextStopSpeech(next, coords));
                }}
              />
            </View>
          </Card>
        ) : null}

        {next ? (
          <Card>
            <Text style={styles.kicker}>NEXT · {next.time}</Text>
            <Text style={styles.nextName}>{next.name}</Text>
            <Muted>{stopLine(next, coords)}</Muted>
          </Card>
        ) : null}

        {!showAll ? (
          <Pressable accessibilityRole="button" onPress={() => setShowAll(true)} style={styles.folded}>
            <Text style={styles.foldedText} numberOfLines={2}>
              {summaryLine(doneCount, rest)}
            </Text>
            <Text style={styles.showAll}>Show all</Text>
          </Pressable>
        ) : (
          <Card>
            {trip.stops.map((s, i) => (
              <Pressable key={s.id} accessibilityRole="button" onPress={() => goTo(i)} style={styles.miniRow}>
                <StopPin n={i + 1} state={stateOf(i)} small />
                <Text style={styles.miniTime}>{s.time}</Text>
                <Text style={[styles.miniName, stateOf(i) === 'done' && { color: Colors.muted }]}>{s.name}</Text>
              </Pressable>
            ))}
            <Button label="Hide" variant="quiet" onPress={() => setShowAll(false)} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function stopLine(stop: Stop, coords: LatLng | null) {
  return coords ? `${distanceLabel(coords, stop.location)} · ${stop.short}` : stop.short;
}

function nextStopSpeech(stop: Stop, from: LatLng) {
  const m = distanceMeters(from, stop.location);
  const mins = walkMinutes(m);
  return `Next stop, ${stop.name}. It is ${spokenDistance(m)} to the ${compassWord(bearingDegrees(from, stop.location))}, about ${mins} ${mins === 1 ? 'minute' : 'minutes'} on foot.`;
}

function summaryLine(doneCount: number, rest: Stop[]) {
  const parts: string[] = [];
  if (doneCount > 0) parts.push(`${doneCount} done`);
  if (rest.length > 0) parts.push(`${rest.length} more: ${rest.map((s) => s.name).join(', ')}`);
  return parts.length > 0 ? parts.join(' · ') : 'See every stop';
}

function StopPin({ n, state, small }: { n: number; state: StopState; small?: boolean }) {
  const size = small ? 24 : 30;
  const bg = state === 'done' ? Colors.done : state === 'now' ? Colors.accent : Colors.card;
  const fg = state === 'later' ? Colors.text : Colors.onAccent;
  const border = state === 'later' ? Colors.text : Colors.card;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: fg, fontWeight: '800', fontSize: small ? 12 : 14 }}>{n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  map: { height: '42%' },
  panel: {
    flex: 1,
    marginTop: -20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  panelContent: { padding: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md, paddingBottom: 120 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#C9C6BE' },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  tripTitle: { fontSize: FontSize.title, fontWeight: '800', color: Colors.text },
  nowCard: { borderColor: Colors.accent, borderWidth: 2 },
  kicker: { fontSize: FontSize.small, fontWeight: '700', color: Colors.accent, letterSpacing: 0.5 },
  stopName: { fontSize: FontSize.title, fontWeight: '800', color: Colors.text },
  nextName: { fontSize: FontSize.large, fontWeight: '700', color: Colors.text },
  body: { fontSize: FontSize.body, color: Colors.text, lineHeight: 21 },
  btnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  folded: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9AA0A8',
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  foldedText: { flex: 1, fontSize: FontSize.body - 1, color: Colors.text },
  showAll: { fontWeight: '700', color: Colors.accent, fontSize: FontSize.body },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 40 },
  miniTime: { width: 72, fontSize: FontSize.small, color: Colors.muted },
  miniName: { flex: 1, fontSize: FontSize.body, fontWeight: '600', color: Colors.text },
  meDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    borderWidth: 4,
    borderColor: Colors.card,
  },
});
