import React, { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, Award, BookOpen, Sparkles, LogIn, AlertCircle } from "lucide-react";
import { getTranslation, Language } from "../translations";
import { LegalFooter } from "./Legal";

interface WelcomeScreenProps {
  onSignUp: (name: string, email: string, role: "student" | "teacher", password: string) => void;
  onLogIn: (email: string, password: string) => void;
  authError: string | null;
  language: Language;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSignUp,
  onLogIn,
  authError,
  language,
}) => {
  const t = getTranslation(language);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) return;
    if (mode === "signup") {
      if (!name.trim()) return;
      if (password.length < 6) {
        setLocalError(t.passwordTooShort);
        return;
      }
      onSignUp(name.trim(), email.trim(), role, password);
    } else {
      onLogIn(email.trim(), password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white p-6 overflow-hidden relative">
      {/* Decorative background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">

        {/* Header Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex p-4 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20"
          >
            <GraduationCap className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent"
          >
            insyte
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-400 mt-2 text-sm max-w-md mx-auto"
          >
            {t.welcomeTagline}
          </motion.p>
        </div>

        {/* Mode Switch */}
        <div className="flex items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "login"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" /> {t.logIn}
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> {t.signUp}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    role === "student"
                      ? "bg-indigo-950/40 border-indigo-500/60"
                      : "bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/30"
                  }`}
                >
                  <BookOpen className={`h-5 w-5 mb-2 ${role === "student" ? "text-indigo-400" : "text-slate-400"}`} />
                  <div className={`font-bold text-sm ${role === "student" ? "text-indigo-200" : "text-slate-300"}`}>{t.studentRole}</div>
                  <p className="text-slate-500 text-[10px] mt-0.5">{t.studentEntryDesc}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    role === "teacher"
                      ? "bg-violet-950/40 border-violet-500/60"
                      : "bg-slate-800/50 border-slate-700/50 hover:border-violet-500/30"
                  }`}
                >
                  <Award className={`h-5 w-5 mb-2 ${role === "teacher" ? "text-violet-400" : "text-slate-400"}`} />
                  <div className={`font-bold text-sm ${role === "teacher" ? "text-violet-200" : "text-slate-300"}`}>{t.teacherRole}</div>
                  <p className="text-slate-500 text-[10px] mt-0.5">{t.teacherPortalDesc}</p>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t.name}</label>
                <input
                  type="text"
                  required
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t.email}</label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t.password}</label>
            <input
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? t.passwordCreatePlaceholder : t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm"
            />
          </div>

          {(authError || localError) && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 font-medium rounded-xl text-sm transition-all text-white shadow-lg cursor-pointer ${
              mode === "signup"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-950/40"
                : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-950/40"
            }`}
          >
            {mode === "signup" ? `${t.createAccount} →` : `${t.logIn} →`}
          </button>
        </form>

        <p className="text-center text-slate-500 text-[11px] mt-4">
          {mode === "login" ? t.noAccountYet : t.alreadyHaveAccount}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-indigo-400 font-medium hover:underline cursor-pointer"
          >
            {mode === "login" ? t.signUp : t.logIn}
          </button>
        </p>

        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <LegalFooter dark />
        </div>

      </div>
    </div>
  );
};
