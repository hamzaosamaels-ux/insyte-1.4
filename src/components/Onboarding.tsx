import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { getTranslation, Language } from "../translations";

interface Step {
  done: boolean;
  label: string;
  action?: () => void;
  actionLabel?: string;
}

// Three-step getting-started card for new teachers. Hidden once all steps
// are done. Each unfinished step offers the button that completes it.
export const OnboardingChecklist: React.FC<{
  hasCommunity: boolean;
  hasSubject: boolean;
  hasShared: boolean;
  onCreateCommunity: () => void;
  onAddSubject: () => void;
  onShareCode: () => void;
  language: Language;
}> = ({ hasCommunity, hasSubject, hasShared, onCreateCommunity, onAddSubject, onShareCode, language }) => {
  const t = getTranslation(language);
  if (hasCommunity && hasSubject && hasShared) return null;

  const steps: Step[] = [
    { done: hasCommunity, label: t.onbStep1, action: hasCommunity ? undefined : onCreateCommunity, actionLabel: t.createClassCommunity },
    { done: hasSubject, label: t.onbStep2, action: !hasCommunity || hasSubject ? undefined : onAddSubject, actionLabel: t.addSubject },
    { done: hasShared, label: t.onbStep3, action: !hasSubject || hasShared ? undefined : onShareCode, actionLabel: t.shareCode }
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 border border-violet-200 dark:border-violet-500/20 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">{t.onbTitle}</h3>
        <span className="ms-auto text-[10px] font-mono font-bold text-violet-500">{doneCount}/3</span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">{t.onbSubtitle}</p>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {s.done
              ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              : <Circle className="h-4.5 w-4.5 text-slate-300 dark:text-slate-600 shrink-0" />}
            <span className={`text-xs ${s.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200 font-semibold"}`}>
              {s.label}
            </span>
            {s.action && (
              <button
                onClick={s.action}
                className="ms-auto px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold cursor-pointer shrink-0"
              >
                {s.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
