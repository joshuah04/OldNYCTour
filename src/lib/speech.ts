import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

import { SPEECH_LANGUAGE } from './config';

type Listener = (speaking: boolean) => void;
const listeners = new Set<Listener>();
let speakingNow = false;
let utterance = 0;

function setSpeaking(value: boolean) {
  speakingNow = value;
  listeners.forEach((l) => l(value));
}

// Speaks text with the phone's built in voice, stopping anything already playing
export function say(text: string) {
  Speech.stop();
  // Callbacks from an older utterance are ignored so they do not hide the Stop button
  const id = ++utterance;
  const finish = () => {
    if (id === utterance) setSpeaking(false);
  };
  setSpeaking(true);
  Speech.speak(text, {
    language: SPEECH_LANGUAGE,
    rate: 0.95,
    onDone: finish,
    onStopped: finish,
    onError: finish,
  });
}

export function stopSpeaking() {
  utterance++;
  Speech.stop();
  setSpeaking(false);
}

// Lets a screen show a "Stop" button while the voice is talking
export function useSpeaking(): boolean {
  const [speaking, setLocal] = useState(speakingNow);
  useEffect(() => {
    listeners.add(setLocal);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);
  return speaking;
}
