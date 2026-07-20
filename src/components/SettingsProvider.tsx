"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FontScale = "normal" | "large" | "xlarge";

interface Settings {
  fontScale: FontScale;
  setFontScale: (s: FontScale) => void;
  /** Whether the guide reads answers aloud automatically. */
  autoSpeak: boolean;
  setAutoSpeak: (v: boolean) => void;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>("normal");
  const [autoSpeak, setAutoSpeakState] = useState(true);

  // Load saved preferences on mount.
  useEffect(() => {
    const savedFont = localStorage.getItem("oldtour.fontScale") as FontScale | null;
    const savedSpeak = localStorage.getItem("oldtour.autoSpeak");
    if (savedFont) setFontScaleState(savedFont);
    if (savedSpeak != null) setAutoSpeakState(savedSpeak === "1");
  }, []);

  // Reflect font scale onto <html data-font> so CSS can react.
  useEffect(() => {
    const attr = fontScale === "normal" ? "" : fontScale;
    if (attr) document.documentElement.setAttribute("data-font", attr);
    else document.documentElement.removeAttribute("data-font");
  }, [fontScale]);

  const setFontScale = useCallback((s: FontScale) => {
    setFontScaleState(s);
    localStorage.setItem("oldtour.fontScale", s);
  }, []);

  const setAutoSpeak = useCallback((v: boolean) => {
    setAutoSpeakState(v);
    localStorage.setItem("oldtour.autoSpeak", v ? "1" : "0");
  }, []);

  return (
    <SettingsContext.Provider
      value={{ fontScale, setFontScale, autoSpeak, setAutoSpeak }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
