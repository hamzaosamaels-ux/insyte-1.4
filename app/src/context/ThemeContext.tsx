import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Theme } from "@insyte/shared/translations";

const THEME_KEY = "insyte_theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [theme, setThemeState] = useState<Theme>((systemScheme === "dark" ? "dark" : "light"));
  const [loaded, setLoaded] = useState(false);

  // First run: fall back to the OS setting, mirroring web's matchMedia check
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      const initial = (saved === "light" || saved === "dark") ? saved : (systemScheme === "dark" ? "dark" : "light");
      setThemeState(initial);
      setColorScheme(initial);
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    setColorScheme(t);
    AsyncStorage.setItem(THEME_KEY, t);
  };

  if (!loaded) return null;

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
