import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail as MailIcon, Send, Inbox, PenSquare, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Mail, UserProfile } from "../types";
import { getTranslation, Language } from "../translations";

interface MailPanelProps {
  currentUser: UserProfile;
  mails: Mail[];
  contacts: UserProfile[];
  onSendMail: (toId: string, subject: string, body: string) => Promise<string | null>;
  onMarkMailRead: (mailId: string) => void;
  language: Language;
}

export const MailPanel: React.FC<MailPanelProps> = ({
  currentUser,
  mails,
  contacts,
  onSendMail,
  onMarkMailRead,
  language
}) => {
  const t = getTranslation(language);
  const [view, setView] = useState<"inbox" | "sent" | "compose">("inbox");
  const [openMail, setOpenMail] = useState<Mail | null>(null);
  const [toId, setToId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const inbox = mails
    .filter(m => m.toId === currentUser.id)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const sentMails = mails
    .filter(m => m.fromId === currentUser.id)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const unreadCount = inbox.filter(m => !m.read).length;

  const handleOpen = (m: Mail) => {
    setOpenMail(m);
    if (!m.read && m.toId === currentUser.id) onMarkMailRead(m.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toId || !subject.trim() || !body.trim() || sending) return;
    setSending(true);
    setError(null);
    const err = await onSendMail(toId, subject.trim(), body.trim());
    setSending(false);
    if (err) {
      setError(err);
    } else {
      setToId("");
      setSubject("");
      setBody("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setView("sent");
    }
  };

  const list = view === "inbox" ? inbox : sentMails;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <MailIcon className="h-5 w-5 text-indigo-500" /> {t.mailTitle}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">{t.mailSubtitle}</p>
        </div>
        <button
          onClick={() => { setView("compose"); setOpenMail(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <PenSquare className="h-4 w-4" /> {t.composeMail}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1c1836]/60 p-1.5 rounded-xl border border-slate-200 dark:border-[#2d2553]/50 w-fit mb-4">
        <button
          onClick={() => { setView("inbox"); setOpenMail(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            view === "inbox" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" /> {t.inbox}
          {unreadCount > 0 && (
            <span className="min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setView("sent"); setOpenMail(null); }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            view === "sent" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Send className="h-3.5 w-3.5" /> {t.sentMail}
        </button>
      </div>

      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 mb-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
          >
            <CheckCircle2 className="h-4 w-4" /> {t.mailSent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose */}
      {view === "compose" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSend}
          className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49] rounded-2xl p-5 space-y-3"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.mailTo}</label>
            <select
              required
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553] focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm text-slate-800 dark:text-slate-100"
            >
              <option value="">{t.selectRecipient}</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role === "teacher" ? t.teacherRole : t.studentRole})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.mailSubject}</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553] focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t.mailBody}</label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2d2553] focus:border-indigo-500 rounded-xl focus:outline-hidden text-sm text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" /> {t.sendMailBtn}
          </button>
        </motion.form>
      )}

      {/* Reading pane */}
      {view !== "compose" && openMail && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49] rounded-2xl p-5"
        >
          <button
            onClick={() => setOpenMail(null)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t.back}
          </button>
          <div className="flex items-center gap-3 mb-4">
            <img src={openMail.fromAvatar} alt={openMail.fromName} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{openMail.fromName}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {t.mailTo}: {openMail.toName} • {new Date(openMail.sentAt).toLocaleString()}
              </div>
            </div>
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-50 mb-2">{openMail.subject}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{openMail.body}</p>
        </motion.div>
      )}

      {/* Mail list */}
      {view !== "compose" && !openMail && (
        <div className="space-y-2">
          {list.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49] rounded-2xl">
              <MailIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">{t.noMail}</p>
            </div>
          ) : (
            list.map(m => (
              <button
                key={m.id}
                onClick={() => handleOpen(m)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  !m.read && m.toId === currentUser.id
                    ? "bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30"
                    : "bg-white dark:bg-[#130f26] border-slate-200 dark:border-[#241c49] hover:border-indigo-300 dark:hover:border-indigo-500/40"
                }`}
              >
                <img
                  src={view === "inbox" ? m.fromAvatar : m.fromAvatar}
                  alt=""
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate ${!m.read && m.toId === currentUser.id ? "font-extrabold text-slate-900 dark:text-white" : "font-semibold text-slate-600 dark:text-slate-300"}`}>
                      {view === "inbox" ? m.fromName : m.toName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                      {new Date(m.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{m.subject}</div>
                </div>
                {!m.read && m.toId === currentUser.id && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
