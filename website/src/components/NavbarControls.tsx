import React from "react";
import { Moon, Sun } from "lucide-react";
import { getTranslation, Language, Theme } from "../translations";

interface NavbarControlsProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Compact language + theme controls for the dashboard navbar.
 * Replaces the language/theme cards that used to live on the Settings page.
 */
export const NavbarControls: React.FC<NavbarControlsProps> = ({
  language,
  setLanguage,
  theme,
  setTheme
}) => {
  const t = getTranslation(language);

  return (
    <div className="flex items-center gap-2">
      {/* Language segmented pill (EN / AR) */}
      <div
        className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a1532]/60 p-1 rounded-xl border border-slate-200 dark:border-[#2d2553]/50"
        role="group"
        aria-label={t.languageLabel}
      >
        <button
          onClick={() => setLanguage("en")}
          title={t.english}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            language === "en"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#251e44]/50"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("ar")}
          title={t.arabic}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            language === "ar"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#251e44]/50"
          }`}
        >
          ع
        </button>
      </div>

      {/* Theme toggle (light <-> dark) */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title={theme === "dark" ? t.lightMode : t.darkMode}
        aria-label={theme === "dark" ? t.lightMode : t.darkMode}
        className="p-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553]/50 hover:bg-slate-50 dark:hover:bg-[#282154] text-slate-500 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
      >
        {theme === "dark" ? (
          <Sun className="h-4.5 w-4.5 text-amber-400" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-violet-500" />
        )}
      </button>
    </div>
  );
};
