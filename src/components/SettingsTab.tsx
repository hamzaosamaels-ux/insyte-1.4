import React, { useState, useRef } from "react";
import { getTranslation, Language } from "../translations";
import { UserProfile } from "../types";
import { Settings, User, Mail, Bell, LogOut, ShieldCheck, Award, GraduationCap, Camera } from "lucide-react";
import { LegalFooter } from "./Legal";

interface SettingsTabProps {
  language: Language;
  user: UserProfile;
  userRole: "student" | "teacher";
  onLogOut: () => void;
  onUpdateAvatar?: (dataUrl: string) => Promise<string | null>;
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
  onLogOut,
  onUpdateAvatar
}) => {
  const t = getTranslation(language);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<string>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  // Read the picked image, downscale it to a square ~256px, and upload as a
  // compressed JPEG data URL so the stored value stays small.
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateAvatar) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError(t.photoMustBeImage);
      return;
    }
    setPhotoBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        // center-crop to a square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const err = await onUpdateAvatar(dataUrl);
        setPhotoBusy(false);
        if (err) setPhotoError(err);
      };
      img.onerror = () => { setPhotoBusy(false); setPhotoError(t.photoMustBeImage); };
      img.src = reader.result as string;
    };
    reader.onerror = () => { setPhotoBusy(false); setPhotoError(t.photoMustBeImage); };
    reader.readAsDataURL(file);
  };

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
          <div className="relative shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover bg-slate-200 dark:bg-slate-700 p-1 border border-violet-200 dark:border-violet-800"
            />
            {onUpdateAvatar && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                title={t.changePhoto}
                className="absolute -bottom-1.5 -end-1.5 p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{user.email}</span>
            </div>
            {onUpdateAvatar && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                className="mt-2 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {photoBusy ? t.uploading : t.changePhoto}
              </button>
            )}
            {photoError && <p className="text-red-500 text-[11px] mt-1">{photoError}</p>}
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

        {/* Browser (OS) notifications opt-in */}
        {typeof Notification !== "undefined" && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#241c49]/80">
            <button
              onClick={() => Notification.requestPermission().then(p => setNotifPerm(p))}
              disabled={notifPerm === "granted"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:cursor-default transition-all bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 disabled:opacity-60"
            >
              <Bell className="h-4 w-4" />
              {notifPerm === "granted" ? t.notifsOn : t.enableNotifs}
            </button>
          </div>
        )}
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

      {/* Legal */}
      <div className="pt-2">
        <LegalFooter />
      </div>
    </div>
  );
};
