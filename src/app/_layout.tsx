import { NativeTabs } from 'expo-router/native-tabs';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { LocationProvider } from '@/state/location';
import { TripProvider } from '@/state/trip';

export default function RootLayout() {
  return (
    <LocationProvider>
      <TripProvider>
        <StatusBar style="dark" />
        <NativeTabs tintColor={Colors.accent}>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
            <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="trip">
            <NativeTabs.Trigger.Icon sf="figure.walk" md="directions_walk" />
            <NativeTabs.Trigger.Label>Trip</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="map">
            <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
            <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="camera">
            <NativeTabs.Trigger.Icon sf={{ default: 'camera', selected: 'camera.fill' }} md="photo_camera" />
            <NativeTabs.Trigger.Label>Camera</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile">
            <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
            <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </TripProvider>
    </LocationProvider>
  );
}
