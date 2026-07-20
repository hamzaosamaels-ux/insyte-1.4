import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { GraduationCap, Award, Sparkles, MessageCircle, Flame, Users } from "lucide-react";
import { getTranslation, Language } from "../translations";

interface AppIntroProps {
  language: Language;
  onGetStarted: () => void;
}

// Mobile-app style onboarding: full-screen slides, swipe + dots + skip.
export const AppIntro: React.FC<AppIntroProps> = ({ language, onGetStarted }) => {
  const t = getTranslation(language);
  // ?still=1 freezes ambient loops (screenshots / testing)
  const still = useReducedMotion() || new URLSearchParams(window.location.search).has("still");
  const rtl = language === "ar";
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward

  const slides = [
    {
      icon: <GraduationCap className="h-14 w-14 text-white" />,
      title: t.landHeadline,
      desc: t.welcomeTagline,
      chips: null
    },
    {
      icon: <Award className="h-14 w-14 text-white" />,
      title: t.landFeat2t,
      desc: t.landFeat2d,
      chips: [
        { icon: <Flame className="h-4 w-4 text-orange-400" />, label: "🔥 7" },
        { icon: <Award className="h-4 w-4 text-amber-300" />, label: "+250 XP" },
        { icon: <Sparkles className="h-4 w-4 text-violet-300" />, label: "AI" }
      ]
    },
    {
      icon: <Users className="h-14 w-14 text-white" />,
      title: t.landFeat1t,
      desc: t.landFeat4d,
      chips: [{ icon: <MessageCircle className="h-4 w-4 text-emerald-300" />, label: t.landFeat4t }]
    }
  ];
  const last = i === slides.length - 1;

  const go = (n: number) => {
    setDir(n > i ? 1 : -1);
    setI(Math.max(0, Math.min(slides.length - 1, n)));
  };

  // Swipe: forward = drag toward inline-start (flips for RTL)
  const onDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const fwd = rtl ? info.offset.x > 60 : info.offset.x < -60;
    const back = rtl ? info.offset.x < -60 : info.offset.x > 60;
    if (fwd && !last) go(i + 1);
    else if (back && i > 0) go(i - 1);
  };

  const slideX = (sign: number) => (still ? 0 : sign * (rtl ? -60 : 60));

  return (
    <div className="min-h-screen h-dvh flex flex-col bg-radial from-slate-900 via-slate-950 to-black text-white overflow-hidden relative">
      <div className="absolute top-[-15%] start-[-20%] w-[70%] h-[50%] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] end-[-20%] w-[70%] h-[50%] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top bar: brand + skip */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <span className="text-lg font-extrabold font-display bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
          insyte
        </span>
        {!last && (
          <button
            onClick={onGetStarted}
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 cursor-pointer transition-colors"
          >
            {t.introSkip}
          </button>
        )}
      </div>

      {/* Slide */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={i}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: slideX(dir) }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideX(-dir) }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="text-center max-w-sm cursor-grab active:cursor-grabbing"
          >
            <motion.div
              animate={still ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex p-6 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-[2rem] mb-7 shadow-2xl shadow-indigo-500/30"
            >
              {slides[i].icon}
            </motion.div>
            <h1 className="text-3xl font-extrabold font-display leading-tight mb-3">
              {slides[i].title}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">{slides[i].desc}</p>
            {slides[i].chips && (
              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                {slides[i].chips!.map((c, k) => (
                  <span
                    key={k}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/70 border border-slate-700/60 rounded-2xl text-xs font-bold"
                  >
                    {c.icon} {c.label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots + CTA */}
      <div className="relative z-10 px-8 pb-10 pt-2">
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, k) => (
            <button
              key={k}
              onClick={() => go(k)}
              aria-label={`${k + 1}/${slides.length}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                k === i ? "w-6 bg-indigo-400" : "w-2 bg-slate-700"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onGetStarted() : go(i + 1))}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer shadow-xl shadow-indigo-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          {last ? t.landCtaStart : t.introNext}
        </button>
      </div>
    </div>
  );
};
