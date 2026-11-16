import React, { useState, useRef, useEffect } from "react";
import {
  NotebookPen, FileText, Loader2, Sparkles, AlertTriangle, Send, ArrowLeft, Paperclip,
  ListChecks, BookOpen, Layers, HelpCircle, RotateCcw, ChevronLeft, ChevronRight, Check, X, Lightbulb
} from "lucide-react";
import { Lesson } from "../types";
import { api, authHeaders } from "../api";
import { SimpleMarkdown } from "./SimpleMarkdown";

type Kind = "summary" | "study_guide" | "flashcards" | "quiz";
type Pane = "sources" | "main" | "studio";

interface Card { front: string; back: string; source: string }
interface Question { question: string; options: string[]; answer: number; hint: string; explain: string; source: string }
interface NotebookAnswer {
  text: string;
  lessons: string[];
  files: string[];
  skipped: string[];
  cards?: Card[];
  questions?: Question[];
}
interface ChatMsg { role: "user" | "assistant"; text: string }

interface Props {
  classId: string | undefined;
  subjectName: string;
  lessons: Lesson[]; // the active class's lessons
  t: any;
}

const panel = "bg-white dark:bg-[#18142c] border border-slate-200 dark:border-[#2b244c] rounded-2xl flex flex-col min-h-0";
const panelHead = "px-4 py-3 border-b border-slate-100 dark:border-[#251e40] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 shrink-0";
const chip = "inline-block px-1.5 py-px rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 text-[10px] font-semibold";

// Flashcards: tap to flip, arrows to move. Nothing is graded.
function Flashcards({ cards, t }: { cards: Card[]; t: any }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];
  const go = (d: number) => { setI((i + d + cards.length) % cards.length); setFlipped(false); };
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => setFlipped(f => !f)}
        aria-label={t.nbFlip}
        className={`w-full max-w-md min-h-[190px] p-6 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
          flipped
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
            : "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50"
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{flipped ? t.nbBack : t.nbFront}</span>
        <span className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">{flipped ? card.back : card.front}</span>
        {flipped && card.source && <span className={chip}>{card.source}</span>}
        {!flipped && <span className="text-[11px] text-slate-400">{t.nbFlip}</span>}
      </button>
      <div className="flex items-center gap-3">
        <button onClick={() => go(-1)} aria-label={t.nbPrev} className="p-2 rounded-xl border border-slate-200 dark:border-[#2d2553] text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-300"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400" data-testid="card-count">{i + 1} / {cards.length}</span>
        <button onClick={() => go(1)} aria-label={t.nbNext} className="p-2 rounded-xl border border-slate-200 dark:border-[#2d2553] text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-300"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
      </div>
    </div>
  );
}

// Practice quiz: a wrong first try gets a hint and one more go, so the student
// thinks again instead of being handed the answer.
function PracticeQuiz({ questions, t }: { questions: Question[]; t: any }) {
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[i];
  const revealed = solved || wrong.length >= 2;

  const pick = (o: number) => {
    if (revealed || wrong.includes(o)) return;
    if (o === q.answer) {
      setSolved(true);
      if (wrong.length === 0) setScore(s => s + 1);
    } else {
      setWrong(w => [...w, o]);
    }
  };
  const next = () => {
    if (i + 1 >= questions.length) { setDone(true); return; }
    setI(i + 1); setWrong([]); setSolved(false);
  };
  const restart = () => { setI(0); setWrong([]); setSolved(false); setScore(0); setDone(false); };

  if (done) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-300 font-mono" data-testid="quiz-score">{score} / {questions.length}</div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t.nbQuizDone}</p>
        <button onClick={restart} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700"><RotateCcw className="h-3.5 w-3.5" />{t.nbTryAgain}</button>
      </div>
    );
  }
  return (
    <div className="space-y-3 max-w-xl mx-auto">
      <div className="text-[11px] font-bold text-slate-400">{t.nbQuestion} {i + 1} / {questions.length}</div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((o, idx) => {
          const isWrong = wrong.includes(idx);
          const isRight = revealed && idx === q.answer;
          return (
            <button
              key={idx}
              onClick={() => pick(idx)}
              disabled={revealed || isWrong}
              className={`w-full text-start px-3.5 py-2.5 rounded-xl border text-sm flex items-center gap-2 transition-colors ${
                isRight
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-semibold"
                  : isWrong
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 line-through"
                    : "bg-white dark:bg-[#201b3a] border-slate-200 dark:border-[#2d2553] text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-300"
              }`}
            >
              {isRight ? <Check className="h-4 w-4 shrink-0" /> : isWrong ? <X className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
              {o}
            </button>
          );
        })}
      </div>
      {!revealed && wrong.length === 1 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200" data-testid="quiz-hint">
          <Lightbulb className="h-4 w-4 shrink-0 mt-px" /><span><b>{t.nbHint}</b> {q.hint || t.nbHintFallback}</span>
        </div>
      )}
      {revealed && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#201b3a] border border-slate-100 dark:border-[#2d2553]/50 text-xs text-slate-700 dark:text-slate-300 space-y-2" data-testid="quiz-explain">
          <p><b>{solved ? t.nbCorrect : t.nbNotQuite}</b> {q.explain}</p>
          {q.source && <span className={chip}>{q.source}</span>}
          <div><button onClick={next} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700">{i + 1 >= questions.length ? t.nbFinish : t.nbNextQuestion}</button></div>
        </div>
      )}
    </div>
  );
}

// Study Notebook: a class's own lessons and files as sources, a chat that
// answers only from them, and study tools made from them. Assignments are never
// a source, and the chat guides instead of answering them.
export function StudentNotebook({ classId, subjectName, lessons, t }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [pane, setPane] = useState<Pane>("main");
  const [view, setView] = useState<"chat" | Kind>("chat");
  const [loading, setLoading] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Partial<Record<Kind, NotebookAnswer>>>({});
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  // Results already fetched this visit, so reopening a tool is instant.
  const seen = useRef(new Map<string, NotebookAnswer>());

  const lessonKey = lessons.map(l => l.id).join(",");
  // A different subject (or a changed lesson list) starts a fresh notebook.
  useEffect(() => {
    setPicked(new Set(lessons.map(l => l.id)));
    setView("chat"); setNotes({}); setChat([]); setError(null); setInput("");
  }, [classId, lessonKey]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [chat, sending]);

  const chosen = lessons.filter(l => picked.has(l.id));
  const lessonIds = chosen.map(l => l.id);
  const selKey = `${classId}:${lessonIds.join(",")}`;
  const noSources = lessons.length === 0;
  const noneChosen = chosen.length === 0;

  const toggle = (id: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setNotes({}); // made from the old selection
    setView("chat");
  };

  const make = async (k: Kind) => {
    if (!classId || loading || noneChosen) return;
    setError(null); setView(k); setPane("main");
    const cached = seen.current.get(`${selKey}:${k}`);
    if (cached) { setNotes(n => ({ ...n, [k]: cached })); return; }
    setLoading(k);
    try {
      const res = await fetch(api("/api/notebook/generate"), {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ classId, kind: k, lessonIds })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.nbError);
      if (data.empty) throw new Error(t.nbNoSources);
      seen.current.set(`${selKey}:${k}`, data);
      setNotes(n => ({ ...n, [k]: data }));
    } catch (e: any) {
      setError(e?.message || t.nbError);
    } finally {
      setLoading(null);
    }
  };

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || !classId || sending || noneChosen) return;
    const history: ChatMsg[] = [...chat, { role: "user", text: q }];
    setChat(history); setInput(""); setError(null); setSending(true); setView("chat");
    try {
      const res = await fetch(api("/api/notebook/chat"), {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ classId, lessonIds, messages: history })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.nbError);
      if (data.empty) throw new Error(t.nbNoSources);
      setChat([...history, { role: "assistant", text: data.text }]);
    } catch (e: any) {
      setError(e?.message || t.nbError);
    } finally {
      setSending(false);
    }
  };

  const tools: { kind: Kind; label: string; desc: string; Icon: any }[] = [
    { kind: "summary", label: t.nbSummary, desc: t.nbSummaryDesc, Icon: ListChecks },
    { kind: "study_guide", label: t.nbStudyGuide, desc: t.nbStudyGuideDesc, Icon: BookOpen },
    { kind: "flashcards", label: t.nbFlashcards, desc: t.nbFlashcardsDesc, Icon: Layers },
    { kind: "quiz", label: t.nbQuiz, desc: t.nbQuizDesc, Icon: HelpCircle }
  ];
  const starters: string[] = [t.nbStarter1, t.nbStarter2, t.nbStarter3, t.nbStarter4];
  const note = view !== "chat" ? notes[view] : undefined;
  const show = (p: Pane) => (pane === p ? "flex" : "hidden lg:flex");

  return (
    <div data-testid="notebook">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-lg shadow-sm"><NotebookPen className="h-4 w-4" /></div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.notebookTitle}{subjectName ? ` · ${subjectName}` : ""}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.notebookDesc}</p>
        </div>
      </div>

      {/* Phones show one panel at a time */}
      <div className="lg:hidden mb-3 grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#201b3a]" role="tablist">
        {([["sources", t.nbSources], ["main", t.nbChat], ["studio", t.nbStudio]] as [Pane, string][]).map(([p, label]) => (
          <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)}
            className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${pane === p ? "bg-white dark:bg-[#18142c] text-indigo-700 dark:text-indigo-300 shadow-xs" : "text-slate-500 dark:text-slate-400"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_260px] gap-3 lg:h-[620px]">
        {/* SOURCES */}
        <section className={`${panel} ${show("sources")}`} aria-label={t.nbSources}>
          <div className={panelHead}>
            <span>{t.nbSources}</span>
            {!noSources && <span className="font-mono normal-case tracking-normal" data-testid="source-count">{chosen.length}/{lessons.length}</span>}
          </div>
          <div className="p-3 overflow-y-auto space-y-1.5">
            {noSources ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 p-1">{t.nbNoSources}</p>
            ) : (
              <>
                <p className="text-[11px] text-slate-400 px-1 pb-1">{t.nbSourcesHint}</p>
                {lessons.map(l => {
                  const files = (l.attachments ?? []).filter(a => a.kind === "file");
                  return (
                    <label key={l.id} className="flex items-start gap-2 p-2 rounded-xl border border-slate-100 dark:border-[#2d2553]/50 bg-slate-50/70 dark:bg-[#201b3a] cursor-pointer hover:border-indigo-200">
                      <input type="checkbox" checked={picked.has(l.id)} onChange={() => toggle(l.id)} className="mt-0.5 accent-indigo-600 cursor-pointer" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"><FileText className="h-3 w-3 text-slate-400 shrink-0" /><span className="truncate">{l.title}</span></span>
                        {files.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5"><Paperclip className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{f.name}</span></span>
                        ))}
                      </span>
                    </label>
                  );
                })}
              </>
            )}
          </div>
        </section>

        {/* CHAT / OPEN NOTE */}
        <section className={`${panel} ${show("main")}`} aria-label={t.nbChat}>
          <div className={panelHead}>
            {view === "chat" ? <span>{t.nbChat}</span> : (
              <button onClick={() => setView("chat")} className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300 cursor-pointer normal-case tracking-normal text-xs font-bold">
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />{t.nbBackToChat}
              </button>
            )}
            {view !== "chat" && <span>{tools.find(x => x.kind === view)?.label}</span>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px]">
            {view === "chat" ? (
              <>
                {chat.length === 0 && (
                  <div className="py-6 text-center space-y-4">
                    <Sparkles className="h-6 w-6 mx-auto text-indigo-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">{noSources ? t.nbNoSources : t.nbChatIntro}</p>
                    {!noSources && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {starters.map(s => (
                          <button key={s} onClick={() => ask(s)} disabled={sending || noneChosen}
                            className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2d2553] text-xs text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {chat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div data-role={m.role} className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-ee-md whitespace-pre-wrap"
                        : "bg-slate-50 dark:bg-[#201b3a] border border-slate-100 dark:border-[#2d2553]/50 text-slate-800 dark:text-slate-100 rounded-es-md"
                    }`}>
                      {m.role === "user" ? m.text : <SimpleMarkdown text={m.text} />}
                    </div>
                  </div>
                ))}
                {sending && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic"><Loader2 className="h-4 w-4 animate-spin" />{t.nbThinking}</div>}
                <div ref={bottom} />
              </>
            ) : loading === view ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic"><Loader2 className="h-4 w-4 animate-spin" />{t.nbWorking}</div>
            ) : note ? (
              <div>
                {note.cards ? <Flashcards key={selKey} cards={note.cards} t={t} />
                  : note.questions ? <PracticeQuiz key={selKey} questions={note.questions} t={t} />
                  : <SimpleMarkdown text={note.text} />}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#2d2553]/50 space-y-1 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {t.nbMadeFrom} {note.lessons.length} {t.nbLessons}{note.files.length > 0 ? `, ${note.files.length} ${t.nbFiles}` : ""}
                  </div>
                  {note.skipped.length > 0 && <div>{t.nbCouldntRead} {note.skipped.join(", ")}</div>}
                  <div>{t.nbDisclaimer}</div>
                </div>
              </div>
            ) : null}

            {error && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />{error}
              </div>
            )}
          </div>

          {view === "chat" && (
            <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="p-3 border-t border-slate-100 dark:border-[#251e40] shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
                  rows={1}
                  maxLength={2000}
                  disabled={noSources || noneChosen}
                  placeholder={noneChosen && !noSources ? t.nbPickSource : t.nbAskPlaceholder}
                  aria-label={t.nbAskPlaceholder}
                  className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2d2553] bg-white dark:bg-[#201b3a] text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 disabled:opacity-60"
                />
                <button type="submit" disabled={sending || !input.trim() || noneChosen} aria-label={t.nbSend}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="h-4 w-4 rtl:-scale-x-100" />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">{t.nbChatFooter}</p>
            </form>
          )}
        </section>

        {/* STUDIO */}
        <section className={`${panel} ${show("studio")}`} aria-label={t.nbStudio}>
          <div className={panelHead}><span>{t.nbStudio}</span></div>
          <div className="p-3 overflow-y-auto space-y-2">
            {tools.map(({ kind, label, desc, Icon }) => (
              <button key={kind} onClick={() => make(kind)} disabled={!!loading || noSources || noneChosen}
                className={`w-full text-start p-3 rounded-xl border flex items-start gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  view === kind
                    ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-[#201b3a] border-slate-200 dark:border-[#2d2553] hover:border-indigo-300"
                }`}>
                {loading === kind ? <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin text-indigo-500" /> : <Icon className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />}
                <span>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{label}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</span>
                </span>
              </button>
            ))}
            <p className="text-[10px] text-slate-400 px-1 pt-1">{t.nbStudioHint}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
