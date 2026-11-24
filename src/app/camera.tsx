import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Muted, Screen, Title } from '@/components/ui';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { describeFacing, describeWhereAmI, type Answer } from '@/lib/describe';
import { compassWord } from '@/lib/geo';
import { MissingKeyError } from '@/lib/places';
import { say, stopSpeaking, useSpeaking } from '@/lib/speech';
import { useHeading } from '@/hooks/use-heading';
import { useUserLocation } from '@/state/location';
import { useTrip } from '@/state/trip';

type Mode = 'what' | 'where';

export default function CameraScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { coords } = useUserLocation();
  const { current } = useTrip();
  const heading = useHeading(focused);
  const speaking = useSpeaking();
  const cameraRef = useRef<CameraView>(null);

  const [mode, setMode] = useState<Mode>('what');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);

  // Stop talking when the user leaves the tab
  useEffect(() => {
    if (!focused) stopSpeaking();
  }, [focused]);

  async function capture() {
    if (!coords) {
      say('I do not know where you are yet. Please allow location access and try again.');
      return;
    }
    setBusy(true);
    try {
      // The photo is only shown on screen for now; the AI that reads it comes later
      if (mode === 'what' && ready) {
        const pic = await cameraRef.current?.takePictureAsync({ quality: 0.4, skipProcessing: true });
        if (pic?.uri) setPhoto(pic.uri);
      }
      const result =
        mode === 'what' ? await describeFacing(coords, heading) : await describeWhereAmI(coords, heading, current);
      setAnswer(result);
      say(result.text);
    } catch (e) {
      const text =
        e instanceof MissingKeyError
          ? 'The Google Maps key is missing, so I cannot look up nearby places.'
          : 'Sorry, something went wrong. Please try again.';
      setAnswer({ title: 'Something went wrong', text });
      say(text);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    stopSpeaking();
    setAnswer(null);
    setPhoto(null);
  }

  if (!permission) return <View style={styles.black} />;

  if (!permission.granted) {
    return (
      <Screen>
        <Title>Camera</Title>
        <Muted>
          Point your phone at a building and NYC Tour will tell you what it is. It can also tell you where you are.
          The app needs the camera to do this.
        </Muted>
        {permission.canAskAgain ? (
          <Button label="Allow camera" variant="primary" large onPress={requestPermission} />
        ) : (
          <Button label="Open Settings" variant="primary" large onPress={() => void Linking.openSettings()} />
        )}
      </Screen>
    );
  }

  // Result screen: photo on top, spoken text below with Replay and Stop
  if (answer) {
    return (
      <View style={styles.root}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Icon
              name={mode === 'what' ? { ios: 'building.2', android: 'apartment' } : { ios: 'location.fill', android: 'near_me' }}
              size={64}
              color={Colors.accent}
            />
          </View>
        )}
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
          <Text style={styles.kicker}>{mode === 'what' ? "WHAT'S THIS?" : 'WHERE AM I?'}</Text>
          <Title>{answer.title}</Title>
          {answer.subtitle ? <Muted>{answer.subtitle}</Muted> : null}
          <View style={styles.transcript}>
            <Text style={styles.transcriptText}>{answer.text}</Text>
          </View>
          <View style={styles.row}>
            <Button
              label="Replay"
              icon={{ ios: 'arrow.clockwise', android: 'replay' }}
              style={{ flex: 1 }}
              onPress={() => say(answer.text)}
            />
            <Button
              label={speaking ? 'Stop' : 'Stopped'}
              icon={{ ios: 'stop.fill', android: 'stop' }}
              style={{ flex: 1 }}
              disabled={!speaking}
              onPress={stopSpeaking}
            />
          </View>
          <Button label="Take another" icon={{ ios: 'camera.fill', android: 'photo_camera' }} variant="primary" onPress={reset} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.black}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        active={focused}
        onCameraReady={() => setReady(true)}
      />

      <View style={[styles.top, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.segment}>
          <SegmentButton label="What's this?" selected={mode === 'what'} onPress={() => setMode('what')} />
          <SegmentButton label="Where am I?" selected={mode === 'where'} onPress={() => setMode('where')} />
        </View>
        <Text style={styles.hint}>
          {mode === 'what' ? 'Point at a building and tap the button' : 'Tap the button to hear where you are'}
          {heading !== null ? ` · facing ${compassWord(heading)}` : ''}
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 90 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'what' ? "What's this?" : 'Where am I?'}
          onPress={capture}
          disabled={busy}
          style={({ pressed }) => [styles.shutter, (pressed || busy) && { opacity: 0.6 }]}>
          <View style={styles.shutterInner}>
            <Icon
              name={mode === 'what' ? { ios: 'building.2.fill', android: 'apartment' } : { ios: 'location.fill', android: 'near_me' }}
              size={30}
              color={Colors.onAccent}
            />
          </View>
        </Pressable>
        <Text style={styles.shutterLabel}>{busy ? 'Looking...' : mode === 'what' ? "What's this?" : 'Where am I?'}</Text>
      </View>
    </View>
  );
}

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.segmentBtn, selected && styles.segmentBtnOn]}>
      <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  black: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', gap: Spacing.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.pill,
    padding: 4,
  },
  segmentBtn: { paddingHorizontal: Spacing.lg, minHeight: 44, justifyContent: 'center', borderRadius: Radius.pill },
  segmentBtnOn: { backgroundColor: Colors.card },
  segmentText: { color: '#FFF', fontSize: FontSize.body, fontWeight: '700' },
  segmentTextOn: { color: Colors.text },
  hint: {
    color: '#FFF',
    fontSize: FontSize.body,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: Spacing.sm },
  shutter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 5,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterLabel: { color: '#FFF', fontSize: FontSize.large, fontWeight: '700' },
  photo: { height: '38%', width: '100%' },
  photoEmpty: { backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    flex: 1,
    marginTop: -20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sheetContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },
  kicker: { fontSize: FontSize.small, fontWeight: '700', color: Colors.accent, letterSpacing: 0.5 },
  transcript: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
    padding: Spacing.lg,
  },
  transcriptText: { fontSize: FontSize.large, lineHeight: 27, color: Colors.text },
  row: { flexDirection: 'row', gap: Spacing.sm },
});
