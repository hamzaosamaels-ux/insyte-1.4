// The teacher's assistant: what needs doing today, a short AI briefing, and one
// row per student (seen, homework, lessons, comments). Every number comes from
// the server's own count; the AI only writes the briefing from those numbers.
import { useEffect, useState } from "react";
import { Bot, RefreshCw, Loader2, AlertTriangle, ClipboardCheck, Clock, UserX, Mail, CalendarClock, BookOpen, Check } from "lucide-react";
import { api, authHeaders } from "../api";
import { SimpleMarkdown } from "./SimpleMarkdown";

type Lang = "en" | "ar";
interface StudentRow { id: string; name: string; lastSeen: string; activeDays7: number; submitted: number; tasksDue: number; missing: string[]; lessonsOpened: number; lessonsTotal: number; comments7: number }
interface ClassFacts {
  id: string; name: string; studentCount: number;
  toGrade: { task: string; count: number }[];
  dueSoon: { task: string; dueDate: string; submitted: number; missing: string[] }[];
  overdue: { task: string; dueDate: string; missing: string[] }[];
  latestLesson: { title: string; notOpened: string[] } | null;
  notSeen7: string[]; activeToday: number; comments7: number; comments24h: number;
  upcomingEvents: { title: string; date: string }[];
  students: StudentRow[];
}
interface Facts { today: string; trackingSince: string; unreadMail: number; classes: ClassFacts[]; totals: { toGrade: number; dueSoon: number; overdueMissing: number; notSeen7: number } }

const L = {
  en: {
    title: "My assistant", sub: "Your to-do list and how every student is doing, counted from your classes.",
    refresh: "Refresh", todo: "To do", allClear: "Nothing waiting. You're all caught up.",
    grade: (n: number, task: string, cls: string) => `Grade ${n} submission${n === 1 ? "" : "s"} for "${task}" (${cls})`,
    overdue: (n: number, task: string, cls: string) => `${n} student${n === 1 ? " hasn't" : "s haven't"} handed in "${task}" (${cls}), which was due`,
    due: (task: string, cls: string, date: string, n: number) => `"${task}" (${cls}) is due ${date}. ${n} still to hand in`,
    notSeen: (n: number, cls: string) => `${n} student${n === 1 ? "" : "s"} in ${cls} not seen for a week`,
    lesson: (n: number, title: string, cls: string) => `${n} student${n === 1 ? " hasn't" : "s haven't"} opened "${title}" (${cls})`,
    mail: (n: number) => `${n} unread message${n === 1 ? "" : "s"} in your mail`,
    event: (title: string, cls: string, date: string) => `Coming up: ${title} (${cls}) on ${date}`,
    briefing: "Briefing", write: "Write my briefing", rewrite: "Write again", writing: "Reading your classes...",
    briefingHint: "A short summary written by AI from the numbers on this page. Students' names are not sent to the AI.",
    students: "Students", name: "Student", seen: "Last seen", days: "Days active (7)", homework: "Homework handed in", lessons: "Lessons opened", comments: "Comments (7 days)",
    missing: "Missing:", never: "Not yet", today: "Today", noStudents: "No students in this class yet.", noClasses: "Create a class first and your assistant will start here.",
    tracking: (d: string) => `Daily activity has been recorded since ${d}. Before that, "last seen" is the last sign-in.`,
    daily: "You also get this as a short note every morning, in the language chosen here.", error: "Couldn't load the assistant. Try again."
  },
  ar: {
    title: "مساعدي", sub: "قائمة مهامك وحالة كل طالب، محسوبة من فصولك.",
    refresh: "تحديث", todo: "المهام", allClear: "لا شيء بانتظارك. كل شيء منجز.",
    grade: (n: number, task: string, cls: string) => `صحّح ${n} تسليم لـ"${task}" (${cls})`,
    overdue: (n: number, task: string, cls: string) => `${n} طالب لم يسلّم "${task}" (${cls}) وقد انتهى موعده`,
    due: (task: string, cls: string, date: string, n: number) => `موعد "${task}" (${cls}) هو ${date}. بقي ${n} لم يسلّموا`,
    notSeen: (n: number, cls: string) => `${n} طالب في ${cls} لم يدخل منذ أسبوع`,
    lesson: (n: number, title: string, cls: string) => `${n} طالب لم يفتح "${title}" (${cls})`,
    mail: (n: number) => `${n} رسالة غير مقروءة في بريدك`,
    event: (title: string, cls: string, date: string) => `قريبًا: ${title} (${cls}) بتاريخ ${date}`,
    briefing: "الملخص", write: "اكتب ملخصي", rewrite: "اكتب من جديد", writing: "أقرأ فصولك...",
    briefingHint: "ملخص قصير يكتبه الذكاء الاصطناعي من أرقام هذه الصفحة. أسماء الطلاب لا تُرسل إلى الذكاء الاصطناعي.",
    students: "الطلاب", name: "الطالب", seen: "آخر دخول", days: "أيام النشاط (7)", homework: "الواجبات المسلَّمة", lessons: "الدروس المفتوحة", comments: "التعليقات (7 أيام)",
    missing: "لم يسلّم:", never: "لم يدخل بعد", today: "اليوم", noStudents: "لا يوجد طلاب في هذا الفصل بعد.", noClasses: "أنشئ فصلًا أولًا وسيبدأ مساعدك من هنا.",
    tracking: (d: string) => `يُسجَّل النشاط اليومي منذ ${d}. قبل ذلك، "آخر دخول" هو آخر تسجيل دخول.`,
    daily: "يصلك هذا أيضًا كملاحظة قصيرة كل صباح باللغة المختارة هنا.", error: "تعذّر تحميل المساعد. حاول مرة أخرى."
  }
};

const card = "bg-white dark:bg-[#130f26] border border-slate-200 dark:border-[#241c49]/80 rounded-2xl";

export function TeacherAssistant({ appLanguage }: { appLanguage: Lang }) {
  const [facts, setFacts] = useState<Facts | null>(null);
  const [lang, setLang] = useState<Lang>(appLanguage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState("");
  const [briefError, setBriefError] = useState("");
  const [writing, setWriting] = useState(false);
  const [classId, setClassId] = useState("");
  const t = L[lang];

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(api("/api/teacher/assistant"), { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFacts(data.facts);
      if (data.language === "en" || data.language === "ar") setLang(data.language);
      setClassId(prev => (data.facts.classes.some((c: ClassFacts) => c.id === prev) ? prev : data.facts.classes[0]?.id ?? ""));
    } catch { setError(L[lang].error); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const chooseLang = (l: Lang) => {
    setLang(l); setBrief(""); setBriefError("");
    fetch(api("/api/teacher/assistant/language"), { method: "POST", headers: authHeaders(true), body: JSON.stringify({ language: l }) }).catch(() => {});
  };

  const write = async () => {
    setWriting(true); setBriefError("");
    try {
      const res = await fetch(api("/api/teacher/assistant/summary"), { method: "POST", headers: authHeaders(true), body: JSON.stringify({ language: lang }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.error);
      setBrief(data.text || "");
    } catch (e: any) { setBriefError(e?.message || t.error); } finally { setWriting(false); }
  };

  const todo: { Icon: any; text: string; names?: string[]; tone: string }[] = [];
  for (const c of facts?.classes ?? []) {
    for (const g of c.toGrade) todo.push({ Icon: ClipboardCheck, text: t.grade(g.count, g.task, c.name), tone: "text-violet-600" });
    for (const o of c.overdue) todo.push({ Icon: AlertTriangle, text: t.overdue(o.missing.length, o.task, c.name), names: o.missing, tone: "text-rose-600" });
    for (const d of c.dueSoon) todo.push({ Icon: Clock, text: t.due(d.task, c.name, d.dueDate, d.missing.length), names: d.missing, tone: "text-amber-600" });
    if (c.notSeen7.length) todo.push({ Icon: UserX, text: t.notSeen(c.notSeen7.length, c.name), names: c.notSeen7, tone: "text-rose-600" });
    if (c.latestLesson?.notOpened.length) todo.push({ Icon: BookOpen, text: t.lesson(c.latestLesson.notOpened.length, c.latestLesson.title, c.name), names: c.latestLesson.notOpened, tone: "text-slate-500" });
    for (const e of c.upcomingEvents) todo.push({ Icon: CalendarClock, text: t.event(e.title, c.name, e.date), tone: "text-sky-600" });
  }
  if (facts?.unreadMail) todo.push({ Icon: Mail, text: t.mail(facts.unreadMail), tone: "text-violet-600" });
  const cls = facts?.classes.find(c => c.id === classId);
  const seen = (d: string) => (!d ? t.never : d === facts?.today ? t.today : d);

  return (
    <div className="space-y-5" dir={lang === "ar" ? "rtl" : "ltr"} data-testid="assistant">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-lg"><Bot className="h-4 w-4" /></div>
          <div>
            <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 font-display">{t.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-[#1c1836]" role="group" aria-label="Language">
            {(["en", "ar"] as Lang[]).map(l => (
              <button key={l} onClick={() => chooseLang(l)} aria-pressed={lang === l}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${lang === l ? "bg-white dark:bg-[#130f26] text-indigo-700 dark:text-indigo-300 shadow-xs" : "text-slate-500 dark:text-slate-400"}`}>
                {l === "en" ? "English" : "العربية"}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b244c] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-300 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{t.refresh}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">{error}</div>}
      {!facts && loading && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t.writing}</div>}
      {facts && facts.classes.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t.noClasses}</p>}

      {facts && facts.classes.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className={`${card} p-5`} aria-label={t.todo}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t.todo} <span className="font-mono" data-testid="todo-count">({todo.length})</span></h3>
              {todo.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400"><Check className="h-4 w-4" />{t.allClear}</p>
              ) : (
                <ul className="space-y-2.5">
                  {todo.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                      <item.Icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.tone}`} />
                      <span>
                        {item.text}
                        {item.names && item.names.length > 0 && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.names.slice(0, 12).join(lang === "ar" ? "، " : ", ")}{item.names.length > 12 ? ` +${item.names.length - 12}` : ""}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${card} p-5`} aria-label={t.briefing}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.briefing}</h3>
                <button onClick={write} disabled={writing} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 disabled:opacity-50">
                  {writing ? t.writing : brief ? t.rewrite : t.write}
                </button>
              </div>
              {briefError && <div role="alert" className="mb-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">{briefError}</div>}
              {brief ? <div className="text-sm text-slate-700 dark:text-slate-200" data-testid="briefing"><SimpleMarkdown text={brief} /></div>
                : <p className="text-xs text-slate-500 dark:text-slate-400">{t.briefingHint}</p>}
              <p className="mt-3 text-[11px] text-slate-400">{t.daily}</p>
            </section>
          </div>

          <section className={`${card} p-5`} aria-label={t.students}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.students}</h3>
              <div className="flex flex-wrap gap-1.5">
                {facts.classes.map(c => (
                  <button key={c.id} onClick={() => setClassId(c.id)} aria-pressed={classId === c.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${classId === c.id ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300" : "border-slate-200 dark:border-[#2b244c] text-slate-600 dark:text-slate-300"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {cls && cls.students.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t.noStudents}</p>}
            {cls && cls.students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-[#241c49]">
                      {[t.name, t.seen, t.days, t.homework, t.lessons, t.comments].map(h => <th key={h} className="py-2 pe-4 text-start font-bold whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {cls.students.map(s => (
                      <tr key={s.id} className="border-b border-slate-50 dark:border-[#1c1836] align-top">
                        <td className="py-2.5 pe-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{s.name}</td>
                        <td className={`py-2.5 pe-4 whitespace-nowrap ${!s.lastSeen ? "text-rose-600" : "text-slate-600 dark:text-slate-300"}`}>{seen(s.lastSeen)}</td>
                        <td className="py-2.5 pe-4 font-mono text-slate-600 dark:text-slate-300">{s.activeDays7}</td>
                        <td className="py-2.5 pe-4 text-slate-600 dark:text-slate-300">
                          <span className="font-mono">{s.tasksDue - s.missing.length}/{s.tasksDue}</span>
                          {s.missing.length > 0 && <span className="block text-xs text-rose-600 dark:text-rose-400">{t.missing} {s.missing.join(lang === "ar" ? "، " : ", ")}</span>}
                        </td>
                        <td className="py-2.5 pe-4 font-mono text-slate-600 dark:text-slate-300">{s.lessonsOpened}/{s.lessonsTotal}</td>
                        <td className="py-2.5 pe-4 font-mono text-slate-600 dark:text-slate-300">{s.comments7}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {facts.trackingSince && <p className="mt-3 text-[11px] text-slate-400">{t.tracking(facts.trackingSince)}</p>}
          </section>
        </>
      )}
    </div>
  );
}
