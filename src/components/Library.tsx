import React, { useMemo, useState } from "react";
import { Library as LibraryIcon, BookOpen, Video, Presentation, Globe, ClipboardList, Search } from "lucide-react";
import { ClassCommunity, Lesson, TaskItem } from "../types";
import { getTranslation, Language } from "../translations";

type Kind = "all" | "lesson" | "video" | "slides" | "link" | "homework";

interface LibraryProps {
  classes: ClassCommunity[];
  lessons: Lesson[];
  tasks: TaskItem[];
  language: Language;
}

// One searchable, filterable shelf for everything published in the user's
// communities: lessons plus their attachments (video/slides/link) and homework.
export const Library: React.FC<LibraryProps> = ({ classes, lessons, tasks, language }) => {
  const t = getTranslation(language);
  const [kind, setKind] = useState<Kind>("all");
  const [subjectId, setSubjectId] = useState<string>("all");
  const [q, setQ] = useState("");

  const classIds = useMemo(() => new Set(classes.map(c => c.id)), [classes]);
  const className = (id: string) => classes.find(c => c.id === id)?.name || "";

  const items = useMemo(() => {
    const myLessons = lessons.filter(l => classIds.has(l.classId));
    const myTasks = tasks.filter(tk => classIds.has(tk.classId));
    const list = [
      ...myLessons.map(l => ({
        key: `l-${l.id}`,
        kinds: [
          "lesson",
          ...(l.videoUrl ? ["video"] : []),
          ...(l.pptUrl ? ["slides"] : []),
          ...(l.webUrl ? ["link"] : [])
        ] as Kind[],
        title: l.title,
        classId: l.classId,
        date: l.publishedAt,
        video: l.videoUrl,
        ppt: l.pptUrl,
        web: l.webUrl,
        due: undefined as string | undefined,
        xp: undefined as number | undefined
      })),
      ...myTasks.map(tk => ({
        key: `t-${tk.id}`,
        kinds: ["homework"] as Kind[],
        title: tk.title,
        classId: tk.classId,
        date: tk.dueDate,
        video: undefined,
        ppt: undefined,
        web: undefined,
        due: tk.dueDate,
        xp: tk.rewardXp
      }))
    ];
    const needle = q.trim().toLowerCase();
    return list
      .filter(it => kind === "all" || it.kinds.includes(kind))
      .filter(it => subjectId === "all" || it.classId === subjectId)
      .filter(it => !needle || it.title.toLowerCase().includes(needle) || className(it.classId).toLowerCase().includes(needle))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [lessons, tasks, classIds, kind, subjectId, q, classes]);

  const chips: { id: Kind; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: t.libAll, icon: <LibraryIcon className="h-3.5 w-3.5" /> },
    { id: "lesson", label: t.libLessons, icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: "video", label: t.libVideos, icon: <Video className="h-3.5 w-3.5" /> },
    { id: "slides", label: t.libSlides, icon: <Presentation className="h-3.5 w-3.5" /> },
    { id: "link", label: t.libLinks, icon: <Globe className="h-3.5 w-3.5" /> },
    { id: "homework", label: t.libHomework, icon: <ClipboardList className="h-3.5 w-3.5" /> }
  ];

  const kindIcon = (it: (typeof items)[number]) =>
    it.kinds.includes("homework") ? <ClipboardList className="h-4 w-4" />
      : it.video ? <Video className="h-4 w-4" />
      : it.ppt ? <Presentation className="h-4 w-4" />
      : it.web ? <Globe className="h-4 w-4" />
      : <BookOpen className="h-4 w-4" />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.librarySearch}
            className="w-full ps-9 pe-4 py-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-indigo-500 rounded-xl focus:outline-hidden text-xs dark:text-slate-200"
          />
        </div>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">{t.libAllSubjects}</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {chips.map(c => (
          <button
            key={c.id}
            onClick={() => setKind(c.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              kind === c.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white dark:bg-[#1c1836] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#2b244c] hover:border-indigo-400/50"
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Shelf */}
      {items.length === 0 ? (
        <p className="text-center text-slate-400 text-xs py-14">{t.libEmpty}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(it => (
            <div
              key={it.key}
              className="p-4 bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl hover:border-indigo-400/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl shrink-0">
                  {kindIcon(it)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-snug break-words">{it.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{className(it.classId)}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">
                    {it.due ? `${t.libDue}: ${it.due}` : it.date ? new Date(it.date).toLocaleDateString() : ""}
                    {typeof it.xp === "number" ? ` · +${it.xp} XP` : ""}
                  </p>
                </div>
              </div>
              {(it.video || it.ppt || it.web) && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {it.video && (
                    <a href={it.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40">
                      <Video className="h-3 w-3" /> {t.libOpenVideo}
                    </a>
                  )}
                  {it.ppt && (
                    <a href={it.ppt} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40">
                      <Presentation className="h-3 w-3" /> {t.libOpenSlides}
                    </a>
                  )}
                  {it.web && (
                    <a href={it.web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-lg text-[10px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40">
                      <Globe className="h-3 w-3" /> {t.libOpenLink}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
