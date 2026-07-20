import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  GraduationCap, Users, Award, Sparkles, MessageCircle, Flame, Globe, LogIn
} from "lucide-react";
import { getTranslation, Language } from "../translations";
import { LegalFooter } from "./Legal";

interface LandingProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onGetStarted: () => void;
  onLogIn: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 }
};

export const Landing: React.FC<LandingProps> = ({ language, setLanguage, onGetStarted, onLogIn }) => {
  const t = getTranslation(language);
  const still = useReducedMotion();

  const features = [
    { icon: Users, title: t.landFeat1t, desc: t.landFeat1d },
    { icon: Award, title: t.landFeat2t, desc: t.landFeat2d },
    { icon: Sparkles, title: t.landFeat3t, desc: t.landFeat3d },
    { icon: MessageCircle, title: t.landFeat4t, desc: t.landFeat4d },
    { icon: Flame, title: t.landFeat5t, desc: t.landFeat5d },
    { icon: Globe, title: t.landFeat6t, desc: t.landFeat6d }
  ];

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-white overflow-x-hidden relative">
      {/* Ambient animated glows */}
      <motion.div
        className="absolute top-[-15%] start-[-10%] w-[55%] h-[55%] bg-indigo-500/15 rounded-full blur-[130px] pointer-events-none"
        animate={still ? undefined : { y: [0, 40, 0], x: [0, 25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] end-[-10%] w-[55%] h-[55%] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none"
        animate={still ? undefined : { y: [0, -40, 0], x: [0, -25, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/60 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold font-display bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              insyte
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white border border-slate-700/60 rounded-xl transition-all cursor-pointer"
            >
              {language === "en" ? "عربي" : "EN"}
            </button>
            <button
              onClick={onLogIn}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" /> {t.logIn}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold font-display leading-tight tracking-tight"
        >
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
            {t.landHeadline}
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-slate-200 text-base md:text-lg mt-5 max-w-2xl mx-auto"
        >
          {t.welcomeTagline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-9 flex items-center justify-center gap-3 flex-wrap"
        >
          <motion.button
            onClick={onGetStarted}
            animate={still ? undefined : { boxShadow: [
              "0 0 24px 0 rgba(99,102,241,0.35)",
              "0 0 44px 6px rgba(139,92,246,0.45)",
              "0 0 24px 0 rgba(99,102,241,0.35)"
            ] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            {t.landCtaStart}
          </motion.button>
          <button
            onClick={onLogIn}
            className="px-7 py-3.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-200 font-bold rounded-2xl text-sm transition-all cursor-pointer"
          >
            {t.logIn}
          </button>
        </motion.div>

        {/* Floating product chips */}
        <div className="mt-14 flex items-center justify-center gap-4 flex-wrap">
          {[
            { icon: <Flame className="h-4 w-4 text-orange-400" />, label: "🔥 7", cls: "border-orange-400/30" },
            { icon: <Award className="h-4 w-4 text-amber-300" />, label: "+250 XP", cls: "border-amber-300/30" },
            { icon: <Sparkles className="h-4 w-4 text-violet-300" />, label: "AI", cls: "border-violet-300/30" }
          ].map((c, i) => (
            <motion.div
              key={i}
              animate={still ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              className={`flex items-center gap-2 px-4 py-2.5 bg-slate-900/70 backdrop-blur border ${c.cls} rounded-2xl text-sm font-bold shadow-xl`}
            >
              {c.icon} {c.label}
            </motion.div>
          ))}
        </div>
      </header>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 py-14">
        <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-extrabold font-display text-center mb-10">
          {t.landFeaturesTitle}
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: (i % 3) * 0.1 }}
              className="bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 transition-colors"
            >
              <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 rounded-2xl mb-4">
                <f.icon className="h-5 w-5 text-indigo-300" />
              </div>
              <h3 className="font-bold text-base mb-1.5">{f.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-14">
        <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-extrabold font-display text-center mb-10">
          {t.landStepsTitle}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[t.landStep1, t.landStep2, t.landStep3].map((step, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className="text-center px-4"
            >
              <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-extrabold text-lg">
                {i + 1}
              </div>
              <p className="text-slate-200 text-sm font-semibold">{step}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-16">
        <motion.div
          {...fadeUp}
          className="bg-gradient-to-r from-indigo-950/70 to-violet-950/70 border border-indigo-500/25 rounded-3xl p-10 text-center backdrop-blur"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold font-display mb-6">{t.landFinalCta}</h2>
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer shadow-xl shadow-indigo-950/50"
          >
            {t.landCtaStart}
          </button>
        </motion.div>
      </section>

      <footer className="relative z-10 max-w-6xl mx-auto px-5 pb-8 pt-2 border-t border-slate-800/60">
        <LegalFooter dark />
      </footer>
    </div>
  );
};
