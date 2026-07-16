import React, { useState } from "react";
import { getTranslation, Language } from "../translations";
import { UserProfile } from "../types";
import { Settings, User, Mail, Bell, LogOut, ShieldCheck, Award, GraduationCap } from "lucide-react";

interface SettingsTabProps {
  language: Language;
  user: UserProfile;
  userRole: "student" | "teacher";
  onLogOut: () => void;
}

/** Small controlled toggle switch persisted to localStorage. */
const Toggle: React.FC<{ storageKey: string; defaultOn?: boolean }> = ({
  storageKey,
  defaultOn = true
}) => {
  const [on, setOn] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved === null ? defaultOn : saved === "true";
  });

  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem(storageKey, String(next));
  };

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={on}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        on ? "bg-violet-600" : "bg-slate-300 dark:bg-[#2d2553]"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5.5" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  language,
  user,
  userRole,
  onLogOut
}) => {
  const t = getTranslation(language);

  const notifRows = [
    { key: "insyte_notif_email", icon: Mail, title: t.notifEmail, desc: t.notifEmailDesc, defaultOn: true },
    { key: "insyte_notif_push", icon: Bell, title: t.notifPush, desc: t.notifPushDesc, defaultOn: true },
    { key: "insyte_notif_digest", icon: Award, title: t.notifDigest, desc: t.notifDigestDesc, defaultOn: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header card banner */}
      <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-5 rounded-2xl">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-500" />
          {t.settings}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          {t.settingsSubtitle}
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4.5 w-4.5 text-indigo-500" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.profileInfo}</h4>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 p-1 border border-violet-200 dark:border-violet-800 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Detail chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c] rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              {userRole === "teacher" ? <ShieldCheck className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
              {t.accountRole}
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
              {userRole === "teacher" ? t.teacherRole : t.studentRole}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c] rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              <Award className="h-3.5 w-3.5" />
              {userRole === "teacher" ? t.standing : t.level}
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
              {userRole === "teacher" ? user.rank : `${t.level} ${user.level}`}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#1c1836] border border-slate-100 dark:border-[#2b244c] rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              <Award className="h-3.5 w-3.5" />
              {t.totalXp}
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
              {user.xp} XP
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-4.5 w-4.5 text-indigo-500" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.notificationsTitle}</h4>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#241c49]/80">
          {notifRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.title}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{row.desc}</div>
                  </div>
                </div>
                <Toggle storageKey={row.key} defaultOn={row.defaultOn} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.accountTitle}</h4>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.signOutDesc}</p>
          <button
            onClick={onLogOut}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <LogOut className="h-4 w-4" />
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
};
