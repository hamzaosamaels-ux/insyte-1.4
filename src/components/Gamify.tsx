import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";

// Thin XP-to-next-level bar. XP resets visually every 1000 (one level).
export const XpBar: React.FC<{ user: UserProfile; className?: string }> = ({ user, className }) => {
  const into = user.xp % 1000;
  const pct = Math.min(100, Math.round((into / 1000) * 100));
  return (
    <div className={`w-28 sm:w-36 ${className || ""}`}>
      <div className="flex items-center justify-between text-[9px] font-mono font-bold mb-0.5">
        <span className="text-indigo-500 dark:text-indigo-400">LV {user.level}</span>
        <span className="text-slate-400">{into}/1000</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-[#241c49] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
};

// Lightweight canvas confetti burst — no dependency. Fires once per `trigger`.
export const Confetti: React.FC<{ trigger: number }> = ({ trigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#6366F1", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899"];
    const N = 140;
    const parts = Array.from({ length: N }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -14 - 4,
      size: Math.random() * 7 + 3,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0
    }));

    let raf = 0;
    const gravity = 0.35;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of parts) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life += 1;
        if (p.y < canvas.height + 30) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - p.life / 120);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    // Respect reduced-motion: skip the animation entirely
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[70]"
      style={{ display: trigger ? "block" : "none" }}
    />
  );
};

// Full-screen level-up celebration banner.
export const LevelUpToast: React.FC<{ level: number | null; onDone: () => void }> = ({ level, onDone }) => {
  useEffect(() => {
    if (level == null) return;
    const id = setTimeout(onDone, 3200);
    return () => clearTimeout(id);
  }, [level, onDone]);

  return (
    <AnimatePresence>
      {level != null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[71] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.5, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="px-8 py-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-center shadow-2xl shadow-violet-900/40 border border-white/15"
          >
            <div className="text-4xl font-extrabold font-display tracking-tight">LEVEL {level}!</div>
            <div className="text-sm font-semibold text-indigo-100 mt-1">You leveled up 🎉</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
