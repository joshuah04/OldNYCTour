import { Linking } from 'react-native';

import { useUserLocation } from '@/state/location';
import { Button, Notice } from './ui';

// Explains missing location access, and offers a pretend Midtown spot when the user is far away
export function LocationNotice() {
  const { status, farFromNyc, usingDemoSpot, setUseDemoSpot } = useUserLocation();

  if (usingDemoSpot) {
    return (
      <Notice
        text="Demo mode: the app is pretending you are standing in Koreatown, Manhattan."
        action={<Button label="Use my real location" variant="quiet" onPress={() => setUseDemoSpot(false)} />}
      />
    );
  }
  if (status === 'denied') {
    return (
      <Notice
        tone="danger"
        text="Location is off for NYC Tour. Turn it on in Settings so the app can guide you."
        action={<Button label="Open Settings" variant="quiet" onPress={() => void Linking.openSettings()} />}
      />
    );
  }
  if (status === 'error') {
    return <Notice tone="danger" text="Your location could not be read. Check that Location Services is on." />;
  }
  if (farFromNyc) {
    return (
      <Notice
        text="You are far from Manhattan, so distances will look large."
        action={<Button label="Pretend I am in Koreatown" variant="quiet" onPress={() => setUseDemoSpot(true)} />}
      />
    );
  }
  return null;
}
