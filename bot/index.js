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
    const r = await fetch(`https://api.github.com/repos/${REPO}/commits/main/status`, {
      headers: { "User-Agent": "insyte-status-bot" }
    });
    const j = await r.json();
    // GitHub answers errors (notably rate limiting, which shared hosting IPs
    // hit easily) with 200-shaped JSON carrying `message` and no `statuses`.
    // Reporting that as "no deploys yet" would be a lie — it means we failed
    // to look, which is a different thing and must read differently.
    if (!r.ok || j.message) {
      return `⚪ Couldn't check deploys — ${esc(j.message || r.status)}`;
    }
    if (!Array.isArray(j.statuses) || j.statuses.length === 0) {
      return "⚪ No deploy has reported on the latest commit yet";
    }
    const sha = (j.sha || "").slice(0, 7);
    const lines = j.statuses.map(s =>
      `${s.state === "success" ? "✅" : s.state === "pending" ? "⏳" : "🔴"} ${esc(s.context)}`
    );
    return `commit <code>${esc(sha)}</code>\n${lines.join("\n")}`;
  } catch (e) {
    return `⚪ Couldn't check deploys — ${esc(e.message)}`;
  }
}

// Actively probe that protected things are actually protected, rather than
// assuming. Each expects a specific rejection; anything else is a finding.
async function checkSecurity() {
  const findings = [];
  const probe = async (label, path, opts, expected) => {
    try {
      const r = await fetch(API + path, opts);
      if (!expected.includes(r.status)) {
        findings.push(`🔴 ${label} returned ${r.status}, expected ${expected.join("/")}`);
      }
    } catch (e) {
      findings.push(`⚪ ${label} — couldn't check (${esc(e.message)})`);
    }
  };

  // Private data must require a session.
  await probe("Profile endpoint without a login", "/api/me", {}, [401]);
  // Writes must require a session, not just a body with an id in it.
  await probe("Awarding XP without a login", "/api/students/add-xp", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId: "x", xpAmount: 1 })
  }, [401]);
  await probe("Creating a class without a login", "/api/classes", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "x", code: "x" })
  }, [401]);
  await probe("Joining a class without a login", "/api/classes/join", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "x" })
  }, [401]);

  // Nothing public should ever carry a secret field.
  try {
    const raw = await (await fetch(`${API}/api/data`)).text();
    for (const field of ["passwordHash", "password_hash", "verificationToken", "resetToken"]) {
      if (raw.includes(field)) findings.push(`🔴 Public data exposes <code>${field}</code>`);
    }
  } catch { /* the data check already reports unreachability */ }

  return findings.length ? findings.join("\n") : "✅ Login required everywhere it should be, no secrets exposed";
}

// Per-service view. Each third party is judged only by what it's actually
// responsible for, so a problem points at the right dashboard instead of
// "something is broken somewhere".
async function checkServices() {
  const lines = [];
  let health = null;
  try {
    health = await (await fetch(`${API}/api/health`)).json();
  } catch { /* handled below */ }

  // Railway runs the backend process. If /api/health answers at all, it's up.
  lines.push(health
    ? "🚂 <b>Railway</b> (backend) — ✅ online"
    : "🚂 <b>Railway</b> (backend) — 🔴 not responding. Everything else fails while this is down");

  // Vercel only serves the frontend.
  try {
    const r = await fetch(SITE, { redirect: "follow" });
    lines.push(r.ok
      ? "▲ <b>Vercel</b> (website) — ✅ serving"
      : `▲ <b>Vercel</b> (website) — 🔴 returned ${r.status}`);
  } catch {
    lines.push("▲ <b>Vercel</b> (website) — 🔴 unreachable");
  }

  // Supabase holds the data. Reachable is not the same as writable, and the
  // difference is exactly what has cost this project data before.
  if (!health) {
    lines.push("🗄 <b>Supabase</b> (database) — ⚪ can't tell, backend is down");
  } else if (!health.supabaseReady) {
    lines.push("🗄 <b>Supabase</b> (database) — 🔴 unreachable from the backend");
  } else if (health.persisting !== true) {
    lines.push(
      "🗄 <b>Supabase</b> (database) — 🔴 <b>connected but NOT saving</b>. New signups and " +
      "changes exist only in memory and are lost on the next restart" +
      (health.lastSaveError ? `\n     ${esc(health.lastSaveError)}` : "")
    );
  } else if (health.schemaProblems?.length) {
    lines.push(`🗄 <b>Supabase</b> (database) — 🔴 missing columns:\n     ${health.schemaProblems.map(esc).join("\n     ")}`);
  } else {
    lines.push("🗄 <b>Supabase</b> (database) — ✅ connected and saving");
  }

  // Brevo sends the verification email, without which nobody can sign up.
  lines.push(health && health.emailEnabled
    ? "✉️ <b>Brevo</b> (email) — ✅ configured"
    : health
      ? "✉️ <b>Brevo</b> (email) — 🔴 not configured, so every signup fails"
      : "✉️ <b>Brevo</b> (email) — ⚪ can't tell, backend is down");

  return lines.join("\n");
}

// A backend that answers but takes 8s is failing in a way "up" doesn't capture.
async function checkSpeed() {
  const t0 = Date.now();
  try {
    await fetch(`${API}/api/health`);
    const ms = Date.now() - t0;
    if (ms > 3000) return `🔴 Backend slow to answer: ${ms}ms`;
    if (ms > 1200) return `⚠️ Backend a bit slow: ${ms}ms`;
    return `✅ Backend responded in ${ms}ms`;
  } catch {
    return "🔴 Backend didn't respond at all";
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
  const [services, backend, deploys, data, security, speed] = await Promise.all([
    checkServices(), checkBackend(), checkDeploys(), checkDataAndLeaks(),
    checkSecurity(), checkSpeed()
  ]);
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  const body = [
    `<b>insyte status</b> — ${stamp} UTC`,
    "",
    "<b>Services</b>", services,
    "", "<b>Backend detail</b>", backend, speed,
    "", "<b>Security</b>", security,
    "", "<b>Last deploy</b>", deploys,
    "", "<b>Data</b>", data
  ].join("\n");

  // Lead with the verdict so nobody has to read the whole thing to know
  // whether to worry.
  const red = (body.match(/🔴/g) || []).length;
  const warn = (body.match(/⚠️/g) || []).length;
  const verdict = red
    ? `🔴 <b>${red} problem${red > 1 ? "s" : ""} need attention</b>`
    : warn ? `⚠️ <b>Running, ${warn} thing${warn > 1 ? "s" : ""} to watch</b>`
    : "✅ <b>All good</b>";
  return `${verdict}\n\n${body}`;
}

const HELP = [
  "<b>insyte bot</b>",
  "",
  "/status — full report",
  "/health — backend only",
  "/deploys — last deploy result",
  "/security — permission and secret-exposure probes",
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
  if (text.startsWith("/security")) return send(chatId, await checkSecurity());
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
