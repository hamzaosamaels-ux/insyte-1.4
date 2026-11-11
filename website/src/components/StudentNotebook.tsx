import React, { useState, useRef, useEffect } from "react";
import { NotebookPen, FileText, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Lesson } from "../types";
import { api, authHeaders } from "../api";
import { SimpleMarkdown } from "./SimpleMarkdown";

type Kind = "summary" | "study_guide";

interface NotebookAnswer {
  text: string;
  lessons: string[];
  files: string[];
  skipped: string[];
}

interface Props {
  classId: string | undefined;
  subjectName: string;
  lessons: Lesson[]; // the active class's lessons
  t: any;
}

// Study Notebook: a summary or study guide made only from this class's own
// lessons and the files the teacher attached. Assignments are never a source.
export function StudentNotebook({ classId, subjectName, lessons, t }: Props) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<NotebookAnswer | null>(null);
  // Results already fetched this visit, so flipping between subjects is instant.
  const seen = useRef(new Map<string, NotebookAnswer>());

  // A different subject means the old answer no longer applies.
  useEffect(() => { setKind(null); setAnswer(null); setError(null); }, [classId]);

  const files = lessons.flatMap(l => (l.attachments ?? []).filter(a => a.kind === "file").map(a => a.name));

  const run = async (k: Kind) => {
    if (!classId || loading) return;
    setKind(k);
    setError(null);
    const cached = seen.current.get(`${classId}:${k}`);
    if (cached) { setAnswer(cached); return; }
    setAnswer(null);
    setLoading(true);
    try {
      const res = await fetch(api("/api/notebook/generate"), {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ classId, kind: k })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.nbError);
      if (data.empty) throw new Error(t.nbNoSources);
      seen.current.set(`${classId}:${k}`, data);
      setAnswer(data);
    } catch (e: any) {
      setError(e?.message || t.nbError);
    } finally {
      setLoading(false);
    }
  };

  const btn = (k: Kind, label: string) => (
    <button
      onClick={() => run(k)}
      disabled={loading || lessons.length === 0}
      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        kind === k
          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
          : "bg-white dark:bg-[#201b3a] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#2d2553] hover:border-indigo-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-3xl shadow-xs">
      <div className="p-4 border-b border-slate-100 dark:border-[#251e40] flex items-center gap-2.5 bg-gradient-to-r from-indigo-50/80 dark:from-indigo-950/20 to-violet-50/80 dark:to-violet-950/20 rounded-t-3xl">
        <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-lg shadow-sm">
          <NotebookPen className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-bold text-xs text-indigo-900 dark:text-indigo-100">{t.notebookTitle}{subjectName ? ` · ${subjectName}` : ""}</h3>
          <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5">{t.notebookDesc}</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{t.nbSources}</div>
          {lessons.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.nbNoSources}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {lessons.map(l => (
                <li key={l.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#201b3a] border border-slate-100 dark:border-[#2d2553]/50 text-[11px] text-slate-700 dark:text-slate-300">
                  <FileText className="h-3 w-3 text-slate-400" />{l.title}
                </li>
              ))}
              {files.map((f, i) => (
                <li key={`f${i}`} className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#201b3a] border border-slate-100 dark:border-[#2d2553]/50 text-[11px] text-slate-500 dark:text-slate-400">{f}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {btn("summary", t.nbSummary)}
          {btn("study_guide", t.nbStudyGuide)}
        </div>

        {!kind && lessons.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{t.nbPick}</p>}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic">
            <Loader2 className="h-4 w-4 animate-spin" />{t.nbWorking}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />{error}
          </div>
        )}

        {answer && (
          <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-[#201b3a] border border-slate-100 dark:border-[#2d2553]/50">
            <SimpleMarkdown text={answer.text} />
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2553]/50 space-y-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                {t.nbMadeFrom} {answer.lessons.length} {t.nbLessons}{answer.files.length > 0 ? `, ${answer.files.length} ${t.nbFiles}` : ""}
              </div>
              {answer.skipped.length > 0 && <div>{t.nbCouldntRead} {answer.skipped.join(", ")}</div>}
              <div>{t.nbDisclaimer}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
