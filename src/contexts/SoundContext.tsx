import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  playKaChing,
  playSwoosh,
  playSuccess,
  playDelete,
  playNotification,
  playTap,
} from "@/lib/sounds";

type SoundType = "kaching" | "swoosh" | "success" | "delete" | "notification" | "tap";

type SoundContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
  play: (sound: SoundType) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

const STORAGE_KEY = "financasja-sound-enabled";

export const useSounds = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSounds must be used within SoundProvider");
  return ctx;
};

const soundMap: Record<SoundType, () => void> = {
  kaching: playKaChing,
  swoosh: playSwoosh,
  success: playSuccess,
  delete: playDelete,
  notification: playNotification,
  tap: playTap,
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const play = useCallback(
    (sound: SoundType) => {
      if (!soundEnabled) return;
      soundMap[sound]?.();
    },
    [soundEnabled]
  );

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, play }}>
      {children}
    </SoundContext.Provider>
  );
};
