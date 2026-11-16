// Teacher tool: create student accounts from a list of names and print QR login
// cards. A card's QR holds a one-time-visible secret; the server stores only its
// hash, so a card can be reprinted (replaced) but never looked up again.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api, authHeaders, SITE_URL } from "../api";
import type { ClassCommunity, UserProfile } from "../types";

export interface CardStudent { id: string; name: string; token: string }
type Lang = "en" | "ar";

const L = {
  en: {
    title: "Add students", hint: "One name per line. Each student gets a card with a QR code — they scan it to sign in. No email or password needed.",
    placeholder: "Ali Hassan\nSara Ahmed\n...", create: "Create accounts & cards", creating: "Creating...", close: "Close",
    print: "Print cards", done: "Accounts created. Print now — the codes can't be shown again (you can issue a new card any time).",
    scan: "Scan with your phone camera to sign in", secret: "This card is your key. Keep it private.", class: "Class", newCard: "New card",
    newCardTitle: "Replaces the old card — the old one stops working"
  },
  ar: {
    title: "إضافة طلاب", hint: "اسم واحد في كل سطر. يحصل كل طالب على بطاقة برمز QR — يمسحها لتسجيل الدخول. لا حاجة لبريد أو كلمة مرور.",
    placeholder: "علي حسن\nسارة أحمد\n...", create: "إنشاء الحسابات والبطاقات", creating: "جارٍ الإنشاء...", close: "إغلاق",
    print: "طباعة البطاقات", done: "تم إنشاء الحسابات. اطبع الآن — لا يمكن عرض الرموز مرة أخرى (يمكنك إصدار بطاقة جديدة في أي وقت).",
    scan: "امسح الرمز بكاميرا هاتفك لتسجيل الدخول", secret: "هذه البطاقة هي مفتاحك. أبقها سرية.", class: "الصف", newCard: "بطاقة جديدة",
    newCardTitle: "تستبدل البطاقة القديمة — القديمة تتوقف عن العمل"
  }
};

function Card({ s, className, lang }: { s: CardStudent; className: string; lang: Lang }) {
  const [src, setSrc] = useState("");
  const t = L[lang];
  useEffect(() => { QRCode.toDataURL(`${SITE_URL}/?qr=${s.token}`, { margin: 1, width: 220, errorCorrectionLevel: "M" }).then(setSrc); }, [s.token]);
  return (
    <div className="card" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="brand">insyte</div>
      {src && <img src={src} alt={`QR ${s.name}`} width={150} height={150} />}
      <div className="name">{s.name}</div>
      <div className="cls">{t.class}: {className}</div>
      <div className="scan">{t.scan}</div>
      <div className="secret">{t.secret}</div>
    </div>
  );
}

export function CardSheet({ students, className, lang, onClose, note }: { students: CardStudent[]; className: string; lang: Lang; onClose: () => void; note?: string }) {
  const t = L[lang];
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 overflow-auto p-4" role="dialog">
      <style>{`
        .sheet{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
        .card{background:#fff;color:#111;border:2px dashed #999;border-radius:12px;padding:12px;text-align:center;break-inside:avoid;font-family:system-ui,sans-serif}
        .card .brand{font-weight:800;font-size:18px;color:#6d28d9}.card .name{font-weight:700;font-size:17px;margin-top:6px}
        .card .cls{font-size:12px;color:#555}.card .scan{font-size:12px;margin-top:6px}.card .secret{font-size:10px;color:#b91c1c;margin-top:4px}
        @media print{body *{visibility:hidden}.print-area,.print-area *{visibility:visible}.print-area{position:absolute;left:0;top:0;width:100%;background:#fff}.no-print{display:none!important}.sheet{grid-template-columns:repeat(3,1fr)}}
      `}</style>
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#130f26] rounded-2xl p-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 max-w-xl">{note || t.done}</p>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer">{t.print}</button>
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer">{t.close}</button>
          </div>
        </div>
        <div className="print-area"><div className="sheet">{students.map((s) => <Card key={s.id} s={s} className={className} lang={lang} />)}</div></div>
      </div>
    </div>
  );
}

export function AddStudentsModal({ activeClass, lang, onClose, onCreated }: {
  activeClass: ClassCommunity; lang: Lang; onClose: () => void;
  onCreated: (allStudents: UserProfile[], allClasses: ClassCommunity[]) => void;
}) {
  const t = L[lang];
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [made, setMade] = useState<CardStudent[] | null>(null);
  const [cname, setCname] = useState(activeClass.name);

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch(api("/api/teacher/students"), {
        method: "POST", headers: authHeaders(true),
        body: JSON.stringify({ classId: activeClass.id, names: text.split("\n") })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not create accounts."); return; }
      setCname(data.className || activeClass.name);
      onCreated(data.allStudents, data.allClasses);
      setMade(data.students);
    } catch { setError("Connection error. Try again."); } finally { setBusy(false); }
  };

  if (made) return <CardSheet students={made} className={cname} lang={lang} onClose={onClose} />;
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" role="dialog">
      <div className="w-full max-w-md bg-white dark:bg-[#130f26] rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.title} — {activeClass.name}</h3>
        <p className="text-xs text-slate-500">{t.hint}</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={t.placeholder}
          className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-[#2b244c] bg-white dark:bg-[#1c1836] text-slate-800 dark:text-slate-100" />
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer">{t.close}</button>
          <button disabled={busy || !text.trim()} onClick={submit} className="px-4 py-2 rounded-xl bg-violet-600 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">{busy ? t.creating : t.create}</button>
        </div>
      </div>
    </div>
  );
}

// Per-student button: issue a replacement card (e.g. lost card).
export function NewCardButton({ student, className, lang }: { student: UserProfile; className: string; lang: Lang }) {
  const [card, setCard] = useState<CardStudent | null>(null);
  const [err, setErr] = useState("");
  const t = L[lang];
  const go = async () => {
    if (!window.confirm(`${t.newCard}: ${student.name}\n${t.newCardTitle}`)) return;
    try {
      const res = await fetch(api(`/api/teacher/students/${encodeURIComponent(student.id)}/new-card`), { method: "POST", headers: authHeaders(true), body: "{}" });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed"); window.alert(data.error || "Failed"); return; }
      setCard({ id: data.student.id, name: data.student.name, token: data.token });
    } catch { setErr("Connection error"); window.alert("Connection error. Try again."); }
  };
  return (
    <>
      <button onClick={go} title={err || t.newCardTitle} className="mt-2 text-[10px] font-bold text-violet-600 dark:text-violet-300 hover:underline cursor-pointer">{t.newCard}</button>
      {card && <CardSheet students={[card]} className={className} lang={lang} onClose={() => setCard(null)} />}
    </>
  );
}
