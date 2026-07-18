import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Flame, Megaphone, ClipboardList, GraduationCap, Mail as MailIcon, UserPlus, CalendarDays } from "lucide-react";
import { AppNotification, NotificationType } from "../types";

const typeIcon: Record<NotificationType, React.ReactNode> = {
  announcement: <Megaphone className="h-3.5 w-3.5" />,
  task: <ClipboardList className="h-3.5 w-3.5" />,
  grade: <GraduationCap className="h-3.5 w-3.5" />,
  mail: <MailIcon className="h-3.5 w-3.5" />,
  join: <UserPlus className="h-3.5 w-3.5" />,
  event: <CalendarDays className="h-3.5 w-3.5" />
};

export const StreakBadge: React.FC<{ streak: number; label: string }> = ({ streak, label }) => (
  <div
    className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-500/20 rounded-xl px-3 py-1.5"
    title={label}
  >
    <Flame className="h-4 w-4 text-orange-500" />
    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono">{streak || 0}</span>
  </div>
);

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  emptyLabel: string;
  title: string;
  markReadLabel: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAllRead,
  emptyLabel,
  title,
  markReadLabel
}) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 25);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553]/50 hover:bg-slate-50 dark:hover:bg-[#282154] text-slate-500 dark:text-slate-400 rounded-xl transition-all cursor-pointer"
        title={title}
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute end-0 top-12 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49] rounded-2xl shadow-2xl z-50 p-2"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{title}</span>
              {unread > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[10px] text-indigo-500 hover:underline font-semibold cursor-pointer"
                >
                  {markReadLabel}
                </button>
              )}
            </div>
            {sorted.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6">{emptyLabel}</p>
            ) : (
              sorted.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 ${
                    n.read ? "opacity-60" : "bg-indigo-50/60 dark:bg-indigo-950/20"
                  }`}
                >
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-500 rounded-lg mt-0.5 shrink-0">
                    {typeIcon[n.type] || <Bell className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{n.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug break-words">{n.body}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
