import React, { useRef, useState } from "react";
import { Paperclip, Link2, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Attachment } from "../types";
import { api, authHeaders } from "../api";
import { getTranslation, Language } from "../translations";

interface AttachmentPickerProps {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  language: Language;
  /** Files are stored in Supabase Storage; disable to allow links only. */
  allowFiles?: boolean;
}

export const attachmentIcon = (a: Attachment) =>
  a.kind === "link" ? <Link2 className="h-3.5 w-3.5" />
    : a.mime?.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5" />
    : <FileText className="h-3.5 w-3.5" />;

/**
 * Attach any number of files and links. Used by lesson publishing, assignment
 * publishing, and student hand-in, so all three behave identically and a
 * teacher is no longer limited to one link of each kind.
 */
export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  value,
  onChange,
  language,
  allowFiles = true
}) => {
  const t = getTranslation(language);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("read failed"));
          reader.readAsDataURL(file);
        });
        const res = await fetch(api("/api/upload"), {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify({ filename: file.name, dataUrl })
        });
        const data = await res.json();
        // An upload that fails must say so — never look like it worked.
        if (!res.ok || !data.attachment) throw new Error(data.error || "Upload failed.");
        added.push(data.attachment);
      } catch (err: any) {
        setError(err.message || "Upload failed.");
      }
    }
    if (added.length) onChange([...value, ...added]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    onChange([...value, {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "link",
      name: linkName.trim() || withScheme,
      url: withScheme
    }]);
    setLinkUrl("");
    setLinkName("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
        {t.attachments}
      </label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(a => (
            <span
              key={a.id}
              className="flex items-center gap-1.5 ps-2.5 pe-1.5 py-1 bg-slate-100 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] rounded-lg text-[11px] text-slate-700 dark:text-slate-200 max-w-full"
            >
              {attachmentIcon(a)}
              <span className="truncate max-w-[180px]">{a.name}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter(x => x.id !== a.id))}
                className="p-0.5 text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                title={t.remove}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {allowFiles && (
        <div>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 hover:border-indigo-400/50 transition-colors"
          >
            {busy
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.uploading}</>
              : <><Paperclip className="h-3.5 w-3.5" /> {t.attachFiles}</>}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder={t.attachLinkUrl}
          className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 focus:outline-hidden"
        />
        <input
          type="text"
          value={linkName}
          onChange={(e) => setLinkName(e.target.value)}
          placeholder={t.attachLinkLabel}
          className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 dark:bg-[#1c1836] border border-slate-200 dark:border-[#2b244c] focus:border-violet-500 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 focus:outline-hidden"
        />
        <button
          type="button"
          onClick={addLink}
          disabled={!linkUrl.trim()}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0 transition-colors"
        >
          {t.addLink}
        </button>
      </div>

      {error && <p className="text-red-500 text-[11px] font-semibold">{error}</p>}
    </div>
  );
};

/** Read-only list of attachments, for lesson/assignment/submission views. */
export const AttachmentList: React.FC<{ items?: Attachment[]; language: Language }> = ({ items, language }) => {
  const t = getTranslation(language);
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.attachments}</span>
      <div className="flex flex-wrap gap-2">
        {items.map(a => (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-bold transition-colors cursor-pointer max-w-full"
          >
            {attachmentIcon(a)}
            <span className="truncate max-w-[200px]">{a.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
