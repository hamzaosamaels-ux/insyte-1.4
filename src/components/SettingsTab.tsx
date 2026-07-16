import React from "react";
import { getTranslation, Language, Theme } from "../translations";
import { Settings, Globe, Moon, Sun, ShieldCheck, Languages } from "lucide-react";

interface SettingsTabProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  userRole: "student" | "teacher";
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  language,
  setLanguage,
  theme,
  setTheme,
  userRole
}) => {
  const t = getTranslation(language);

  return (
    <div className="space-y-6">
      {/* Header card banner */}
      <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-5 rounded-2xl">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-500" />
          {t.settings}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Customize your learning dashboard environment, language locales, and display preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selection Card */}
        <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Globe className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {t.languageLabel}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Change the localization and text layout direction.
                </p>
              </div>
            </div>

            {/* Arabic Localization Explanation */}
            {language === "ar" && (
              <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 p-3 rounded-xl mb-4 leading-relaxed">
                {t.arabicFontActive}
              </p>
            )}

            <div className="space-y-2.5">
              <button
                onClick={() => setLanguage("en")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-indigo-50/50 dark:bg-indigo-950/25 border-indigo-300 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-50/50 dark:bg-[#1c1836] border-slate-100 dark:border-[#2b244c] text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇺🇸</span>
                  <span>{t.english}</span>
                </div>
                {language === "en" && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>

              <button
                onClick={() => setLanguage("ar")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  language === "ar"
                    ? "bg-indigo-50/50 dark:bg-indigo-950/25 border-indigo-300 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-50/50 dark:bg-[#1c1836] border-slate-100 dark:border-[#2b244c] text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇸🇦</span>
                  <span>{t.arabic}</span>
                </div>
                {language === "ar" && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-[#241c49]/80 pt-3 mt-6 flex items-center gap-1.5 justify-start">
            <Languages className="h-3.5 w-3.5" />
            <span>Updates portal text instantly</span>
          </div>
        </div>

        {/* Theme Mode Card */}
        <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {t.themeLabel}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Select between light mode and dark mode.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setTheme("light")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-indigo-50/50 dark:bg-indigo-950/25 border-indigo-300 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-50/50 dark:bg-[#1c1836] border-slate-100 dark:border-[#2b244c] text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>{t.lightMode}</span>
                </div>
                {theme === "light" && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-indigo-50/50 dark:bg-indigo-950/25 border-indigo-300 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-50/50 dark:bg-[#1c1836] border-slate-100 dark:border-[#2b244c] text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-violet-400" />
                  <span>{t.darkMode}</span>
                </div>
                {theme === "dark" && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-[#241c49]/80 pt-3 mt-6 flex items-center gap-1.5 justify-start">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Persisted automatically across sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
