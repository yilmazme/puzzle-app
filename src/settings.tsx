import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deviceLanguage,
  isLanguage,
  Language,
  Params,
  translate,
  TranslationKey,
} from './i18n';
import { setSoundEnabled as applySoundEnabled } from './sound';

const SOUND_KEY = 'puzzle.soundEnabled.v1';
const LANGUAGE_KEY = 'puzzle.language.v1';

type Settings = {
  soundEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  language: Language;
  setLanguage: (value: Language) => void;
  t: (key: TranslationKey, params?: Params) => string;
};

const SettingsContext = createContext<Settings>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  language: 'en',
  setLanguage: () => {},
  t: (key, params) => translate('en', key, params),
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setEnabled] = useState(true);
  const [language, setLang] = useState<Language>(deviceLanguage);

  useEffect(() => {
    AsyncStorage.multiGet([SOUND_KEY, LANGUAGE_KEY])
      .then(([[, sound], [, lang]]) => {
        if (sound === 'false') {
          setEnabled(false);
          applySoundEnabled(false);
        }
        if (isLanguage(lang)) setLang(lang);
      })
      .catch(() => {});
  }, []);

  const setSoundEnabled = useCallback((value: boolean) => {
    setEnabled(value);
    applySoundEnabled(value);
    AsyncStorage.setItem(SOUND_KEY, String(value)).catch(() => {});
  }, []);

  const setLanguage = useCallback((value: Language) => {
    setLang(value);
    AsyncStorage.setItem(LANGUAGE_KEY, value).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Params) => translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ soundEnabled, setSoundEnabled, language, setLanguage, t }),
    [soundEnabled, setSoundEnabled, language, setLanguage, t],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
