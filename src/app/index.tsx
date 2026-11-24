import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LocationNotice } from '@/components/location-notice';
import { Button, Card, Icon, Muted, Screen } from '@/components/ui';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { describeWhereAmI } from '@/lib/describe';
import { distanceLabel } from '@/lib/geo';
import { say, stopSpeaking, useSpeaking } from '@/lib/speech';
import { useUserLocation } from '@/state/location';
import { useTrip } from '@/state/trip';

export default function HomeScreen() {
  const { coords } = useUserLocation();
  const { trip, current, currentIndex, finished } = useTrip();
  const speaking = useSpeaking();
  const [busy, setBusy] = useState(false);
  const [placeLine, setPlaceLine] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);

  // Street name for the line at the top, looked up on the phone when the user moves
  const lat = coords ? coords.latitude.toFixed(3) : null;
  const lng = coords ? coords.longitude.toFixed(3) : null;
  useEffect(() => {
    if (lat === null || lng === null) return;
    let cancelled = false;
    Location.reverseGeocodeAsync({ latitude: Number(lat), longitude: Number(lng) })
      .then(([a]) => {
        if (cancelled || !a) return;
        const street = a.street ?? a.name;
        const area = a.district ?? a.city;
        setPlaceLine([street, area].filter(Boolean).join(', ') || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  async function whereAmI() {
    if (speaking) {
      stopSpeaking();
      return;
    }
    if (!coords) {
      say('I do not know where you are yet. Please allow location access and try again.');
      return;
    }
    setBusy(true);
    try {
      // The Home screen has no compass, so directions use north, south, east and west
      const answer = await describeWhereAmI(coords, null, current);
      setLastAnswer(answer.text);
      say(answer.text);
    } catch {
      say('Sorry, I could not work out where you are right now.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.locRow}>
        <Icon name={{ ios: 'mappin.and.ellipse', android: 'location_on' }} size={18} color={Colors.muted} />
        <Text style={styles.locText}>{placeLine ? `You are at ${placeLine}` : 'Finding where you are...'}</Text>
      </View>
      <Text style={styles.greet}>{'Hello!\nHow can I help?'}</Text>

      <LocationNotice />

      <Pressable accessibilityRole="button" onPress={() => router.navigate('/trip')}>
        <Card style={styles.tripCard}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.tripKicker}>
              {finished ? `${trip.title} · Finished` : `Today's trip · Stop ${currentIndex + 1} of ${trip.stops.length}`}
            </Text>
            <Text style={styles.tripName}>{current ? `Now: ${current.name}` : 'All stops done'}</Text>
            {current && coords ? <Muted>{distanceLabel(coords, current.location)}</Muted> : null}
          </View>
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} color={Colors.accent} />
        </Card>
      </Pressable>

      <View style={styles.bigWrap}>
        <View style={styles.bigRing}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={speaking ? 'Stop speaking' : 'Where am I?'}
            onPress={whereAmI}
            disabled={busy}
            style={({ pressed }) => [styles.bigButton, (pressed || busy) && { opacity: 0.75 }]}>
            <Icon
              name={speaking ? { ios: 'stop.fill', android: 'stop' } : { ios: 'location.fill', android: 'near_me' }}
              size={56}
              color={Colors.onAccent}
            />
          </Pressable>
        </View>
        <Text style={styles.bigLabel}>{busy ? 'Looking around...' : speaking ? 'Tap to stop' : 'Where am I?'}</Text>
        <Muted>Answers are spoken out loud</Muted>
      </View>

      {lastAnswer ? (
        <Card>
          <Muted>{lastAnswer}</Muted>
          <Button label="Replay" icon={{ ios: 'arrow.clockwise', android: 'replay' }} onPress={() => say(lastAnswer)} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { color: Colors.muted, fontSize: FontSize.body, flexShrink: 1 },
  greet: { fontSize: FontSize.hero, lineHeight: 38, fontWeight: '800', color: Colors.text },
  tripCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tripKicker: { fontSize: FontSize.small, color: Colors.muted, fontWeight: '600' },
  tripName: { fontSize: FontSize.large + 1, fontWeight: '700', color: Colors.text },
  bigWrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  bigRing: {
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigLabel: { fontSize: FontSize.large + 1, fontWeight: '700', color: Colors.text },
});
