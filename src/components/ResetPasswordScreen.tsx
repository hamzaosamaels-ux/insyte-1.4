import React, { useState } from "react";
import { motion } from "motion/react";
import { GraduationCap, AlertCircle, KeyRound } from "lucide-react";
import { getTranslation, Language } from "../translations";

interface ResetPasswordScreenProps {
  token: string;
  onSubmit: (token: string, newPassword: string) => Promise<string | null>;
  onCancel: () => void;
  language: Language;
}

// Landed here from the reset-password email link (?reset=<token>, captured
// and stripped by App.tsx). Same visual shell as WelcomeScreen.
export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  token,
  onSubmit,
  onCancel,
  language,
}) => {
  const t = getTranslation(language);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.resetPasswordMismatch);
      return;
    }
    setSubmitting(true);
    onSubmit(token, password)
      .then((err) => { if (err) setError(err); })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white p-6 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex p-4 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20"
          >
            <KeyRound className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
            {t.resetPasswordTitle}
          </h1>
          <p className="text-slate-300 mt-2 text-sm">{t.resetPasswordDesc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="reset-password" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
              {t.resetNewPassword}
            </label>
            <input
              id="reset-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder={t.passwordCreatePlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm"
            />
          </div>
          <div>
            <label htmlFor="reset-password-confirm" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
              {t.resetConfirmPassword}
            </label>
            <input
              id="reset-password-confirm"
              type="password"
              required
              autoComplete="new-password"
              placeholder={t.passwordCreatePlaceholder}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 font-bold rounded-xl text-sm transition-all text-white shadow-xl shadow-indigo-950/50 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {submitting ? t.verifyResending : t.resetSubmitButton}
          </button>
        </form>

        <p className="text-center mt-5">
          <button onClick={onCancel} className="text-slate-400 hover:text-white text-xs font-medium cursor-pointer">
            {t.verifyGoToLogin}
          </button>
        </p>

        <div className="flex items-center justify-center gap-2 mt-6 opacity-60">
          <GraduationCap className="h-4 w-4" />
          <span className="text-xs font-bold">insyte</span>
        </div>
      </div>
    </div>
  );
};
