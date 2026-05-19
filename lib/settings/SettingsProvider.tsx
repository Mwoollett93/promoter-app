"use client";

import * as React from "react";

import {
  type AppSettings,
  DEFAULT_SETTINGS,
  SETTINGS_UPDATED_EVENT,
  applyDocumentPreferences,
  loadSettings,
  mergeSettings,
  saveSettings,
} from "@/lib/settings/settings";

type SettingsContextValue = {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  replaceSettings: (next: AppSettings) => void;
  patchSettings: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);

  const hydrate = React.useCallback(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applyDocumentPreferences(loaded.preferences);
  }, []);

  React.useEffect(() => {
    hydrate();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "promosync:settings") hydrate();
    };

    const onSettingsUpdated = () => hydrate();

    window.addEventListener("storage", onStorage);
    window.addEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    };
  }, [hydrate]);

  const replaceSettings = React.useCallback((next: AppSettings) => {
    saveSettings(next);
    setSettings(next);
  }, []);

  const patchSettings = React.useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => {
      const next = mergeSettings({ ...current, ...patch });
      saveSettings(next);
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      settings,
      setSettings,
      replaceSettings,
      patchSettings,
    }),
    [settings, replaceSettings, patchSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
