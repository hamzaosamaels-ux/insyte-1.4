import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTranslation, type Language } from "@insyte/shared/translations";

const LANGUAGE_KEY = "insyte_language";

interface LanguageContextValue {
  language: Language;
  t: ReturnType<typeof getTranslation>;
  // Unlike web's instant `dir` flip, RN only applies RTL after a reload —
  // callers must tell the user to restart, there's no way around it.
  setLanguage: (lang: Language) => void;
  restartRequired: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [loaded, setLoaded] = useState(false);
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
      const initial: Language = saved === "ar" ? "ar" : "en";
      setLanguageState(initial);
      setLoaded(true);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang);
    const shouldBeRTL = lang === "ar";
    if (shouldBeRTL !== I18nManager.isRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      setRestartRequired(true);
    }
  };

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ language, t: getTranslation(language), setLanguage, restartRequired }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
