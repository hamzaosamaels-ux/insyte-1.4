// insyte status bot — read-only.
//
// Deliberately has NO database access and NO write powers. Everything it
// reports comes from the public /api/health and /api/data endpoints, so a
// leaked bot token can never become a leaked database. Adding write actions
// later would change that, and should be thought about separately.
//
// Zero dependencies: Telegram's Bot API is plain HTTPS and Node has fetch.
//
// Env:
//   TELEGRAM_BOT_TOKEN  from @BotFather
//   ALLOWED_USER_IDS    comma-separated Telegram numeric ids. Anyone not
//                       listed is ignored — reports expose infrastructure
//                       state, which is not for students.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED = (process.env.ALLOWED_USER_IDS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

const API = "https://insyte-14-production.up.railway.app";
const SITE = "https://insyte-1-4.vercel.app";
const REPO = "hamzaosamaels-ux/insyte-1.4";

if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}

const tg = (method, body) =>
  fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(r => r.json());

const send = (chatId, text) =>
  tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });

// Each check returns a line for the report. They're independent on purpose:
// one failing check should still leave the rest of the report useful.
async function checkBackend() {
  try {
    const h = await (await fetch(`${API}/api/health`)).json();
    const lines = [];
    lines.push(h.persisting === true
      ? "✅ Saving data normally"
      : `🔴 <b>NOT SAVING</b> — new data is only in memory and will be lost on restart${h.lastSaveError ? `\n   ${esc(h.lastSaveError)}` : ""}`);
    lines.push(h.supabaseReady ? "✅ Database connected" : "🔴 Database unreachable");
    lines.push(h.emailEnabled ? "✅ Signup emails working" : "🔴 Signup emails off — new signups fail");
    if (h.schemaProblems?.length) {
      lines.push(`🔴 Database is missing columns the code needs:\n   ${h.schemaProblems.map(esc).join("\n   ")}`);
    }
    return lines.join("\n");
  } catch (e) {
    return `🔴 Backend unreachable — the app is down for everyone\n   ${esc(String(e.message))}`;
  }
}

async function checkSite() {
  try {
    const r = await fetch(SITE, { redirect: "follow" });
    return r.ok ? "✅ Website loading" : `🔴 Website returned ${r.status}`;
  } catch {
    return "🔴 Website unreachable";
  }
}

async function checkDeploys() {
  try {
    const j = await (await fetch(`https://api.github.com/repos/${REPO}/commits/main/status`)).json();
    const parts = (j.statuses || []).map(s =>
      `${s.state === "success" ? "✅" : s.state === "pending" ? "⏳" : "🔴"} ${esc(s.context)}`
    );
    return parts.length ? parts.join("\n") : "⚪ No deploy status reported yet";
  } catch {
    return "⚪ Couldn't read deploy status";
  }
}

async function checkDataAndLeaks() {
  try {
    const d = await (await fetch(`${API}/api/data`)).json();
    const counts = `👥 ${d.students.length} students · ${d.teachers.length} teachers · ${d.classes.length} classes · ${d.lessons.length} lessons · ${d.tasks.length} tasks`;
    // Anonymous callers must never receive a join code.
    const leaked = (d.classes || []).filter(c => c.code).length;
    const leak = leaked === 0
      ? "✅ No join codes exposed publicly"
      : `🔴 ${leaked} class join code(s) readable by anyone — they can enrol themselves`;
    return `${counts}\n${leak}`;
  } catch {
    return "⚪ Couldn't read app data";
  }
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function buildReport() {
  const [backend, site, deploys, data] = await Promise.all([
    checkBackend(), checkSite(), checkDeploys(), checkDataAndLeaks()
  ]);
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  return [
    `<b>insyte status</b> — ${stamp} UTC`,
    "",
    "<b>Backend</b>", backend,
    "", "<b>Website</b>", site,
    "", "<b>Last deploy</b>", deploys,
    "", "<b>Data</b>", data
  ].join("\n");
}

const HELP = [
  "<b>insyte bot</b>",
  "",
  "/status — full report",
  "/health — backend only",
  "/deploys — last deploy result",
  "",
  "Anything else I don't understand — ask in Claude Code, it has the full context."
].join("\n");

async function handle(msg) {
  const chatId = msg.chat?.id;
  const fromId = String(msg.from?.id || "");
  if (!chatId) return;

  // Reports show infrastructure state and failure messages, so the allowlist
  // is the whole access-control story. Unlisted users get nothing back at all.
  if (ALLOWED.length && !ALLOWED.includes(fromId)) {
    console.log(`ignored message from ${fromId}`);
    return;
  }

  const text = (msg.text || "").trim().toLowerCase();
  if (text.startsWith("/health")) return send(chatId, await checkBackend());
  if (text.startsWith("/deploys")) return send(chatId, await checkDeploys());
  if (text.startsWith("/start") || text.startsWith("/help")) return send(chatId, HELP);
  // Anything else, including "hi", gets the full report — that's the point.
  return send(chatId, await buildReport());
}

let offset = 0;
async function poll() {
  try {
    const res = await tg("getUpdates", { offset, timeout: 30 });
    for (const u of res.result || []) {
      offset = u.update_id + 1;
      if (u.message) await handle(u.message).catch(e => console.error("handler:", e));
    }
  } catch (e) {
    console.error("poll:", e.message);
    await new Promise(r => setTimeout(r, 5000)); // back off, don't hammer
  }
  poll();
}

console.log(`insyte bot up. allowlist: ${ALLOWED.length || "OPEN (set ALLOWED_USER_IDS!)"}`);
poll();
