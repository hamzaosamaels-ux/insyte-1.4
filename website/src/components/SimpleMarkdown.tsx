import React from "react";

// Small, safe Markdown for AI answers: headings, bullet and numbered lists,
// **bold**, and [Source title] citations shown as chips. It builds React nodes
// only and never injects raw HTML, so text from a model or a lesson can't
// carry markup into the page.

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]{1,80})\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${keyBase}-${i++}`}>{m[1]}</strong>);
    } else {
      out.push(
        <span
          key={`${keyBase}-${i++}`}
          className="inline-block align-baseline mx-0.5 px-1.5 py-px rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 text-[10px] font-semibold"
        >
          {m[2]}
        </span>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={`p${blocks.length}`} className="my-1.5">{inline(para.join(" "), `p${blocks.length}`)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    const k = `l${blocks.length}`;
    blocks.push(
      <Tag key={k} className={`my-1.5 ps-5 space-y-1 ${list.ordered ? "list-decimal" : "list-disc"}`}>
        {list.items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>)}
      </Tag>
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (!line) { flushPara(); flushList(); continue; }
    if (heading) {
      flushPara(); flushList();
      const k = `h${blocks.length}`;
      blocks.push(
        <h4 key={k} className={`font-bold text-slate-900 dark:text-slate-100 ${heading[1].length === 1 ? "text-base mt-3" : heading[1].length === 2 ? "text-sm mt-4" : "text-xs mt-3"} mb-1`}>
          {inline(heading[2], k)}
        </h4>
      );
    } else if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();
  return <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200">{blocks}</div>;
}
