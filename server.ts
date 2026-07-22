import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { supabaseEnabled, loadFromSupabase, saveToSupabase, uploadAvatar } from "./supabase-store";
import { GoogleGenAI } from "@google/genai";
// NOTE: `vite` is imported lazily inside the dev branch below so the production
// server (and Railway's build) never needs vite/tailwind installed.

const DB_FILE = path.join(process.cwd(), "db.json");

// ---- Password hashing + session tokens (built-in crypto, no dependencies) ----

// Store as "salt:hash". scrypt is deliberately slow, which resists brute force.
function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64).toString("hex");
  // Constant-time compare so timing can't leak the hash
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function newToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// ---- Per-IP rate limiting (in-memory, no dependencies) ----
// Counts requests per IP inside a rolling window; over the cap -> 429.
// Auth endpoints get a much tighter cap to slow password guessing.
function makeRateLimiter(windowMs: number, max: number, label: string) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  // Drop expired windows so the map can't grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) {
      if (h.resetAt <= now) hits.delete(ip);
    }
  }, windowMs).unref?.();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || h.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    h.count++;
    if (h.count > max) {
      res.setHeader("Retry-After", Math.ceil((h.resetAt - now) / 1000));
      return res.status(429).json({
        error: `Too many ${label} requests. Try again in a bit.`
      });
    }
    next();
  };
}

// Types for DB
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  avatar: string;
  xp: number;
  level: number;
  rank: string;
  joinedClasses: string[];
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  readLessons: string[]; // Lesson ids already marked read (each awards XP once)
  passwordHash?: string; // "salt:hash"; never sent to the client
}

interface Mail {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
}

interface AppNotification {
  id: string;
  userId: string;
  type: "announcement" | "task" | "grade" | "mail" | "join" | "event";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface ClassCommunity {
  id: string;
  name: string;
  code: string;
  description: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  color?: string;
}

interface Lesson {
  id: string;
  classId: string;
  title: string;
  content: string;
  publishedAt: string;
  videoUrl?: string;
  pptUrl?: string;
  webUrl?: string;
  webUrlTitle?: string;
}

interface TaskItem {
  id: string;
  classId: string;
  title: string;
  description: string;
  rewardXp: number;
  dueDate: string;
  type: "text" | "dragdrop" | "quiz";
  dragItems?: string[];
  dropZones?: string[];
  correctPairing?: Record<string, string>;
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
}

interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  content: string;
  submittedAt: string;
  isGraded: boolean;
  scoreXpEarned: number;
  feedback?: string;
}

interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  authorName: string;
  publishedAt: string;
}

interface ChatMessage {
  id: string;
  classId: string;
  senderId: string;
  senderName: string;
  senderRole: "student" | "teacher";
  senderAvatar: string;
  text: string;
  timestamp: string;
}

interface ClassEvent {
  id: string;
  classId: string;
  title: string;
  description: string;
  date: string;
  time: string;
}

interface DbSchema {
  students: UserProfile[];
  teachers: UserProfile[];
  classes: ClassCommunity[];
  lessons: Lesson[];
  tasks: TaskItem[];
  announcements: Announcement[];
  chatMessages: ChatMessage[];
  events: ClassEvent[];
  submissions: TaskSubmission[];
  mails: Mail[];
  notifications: AppNotification[];
  sessions: Record<string, string>; // token -> userId
}


// Fresh empty database — no premade accounts or content
const seedData: DbSchema = {
  students: [],
  teachers: [],
  classes: [],
  lessons: [],
  tasks: [],
  announcements: [],
  chatMessages: [],
  events: [],
  submissions: [],
  mails: [],
  notifications: [],
  sessions: {}
};

// Fill in missing/renamed fields so old data and both storage backends produce
// the same in-memory shape.
function normalize(db: any): DbSchema {
  if (db.teacher && !db.teachers) {
    db.teachers = [db.teacher];
    delete db.teacher;
  }
  for (const key of Object.keys(seedData) as (keyof DbSchema)[]) {
    if (key === "sessions") {
      if (!db.sessions || typeof db.sessions !== "object") db.sessions = {};
    } else if (!Array.isArray(db[key])) {
      db[key] = [];
    }
  }
  for (const user of [...db.students, ...db.teachers]) {
    if (typeof user.streak !== "number") user.streak = 0;
    if (!user.lastActiveDate) user.lastActiveDate = "";
    if (!Array.isArray(user.readLessons)) user.readLessons = [];
  }
  return db as DbSchema;
}

// When Supabase is configured, the whole DB lives in this in-memory cache
// (loaded once at boot). readDb/writeDb stay synchronous; writes persist to
// Supabase in the background. Null means "use the local db.json file instead".
let memCache: DbSchema | null = null;

// True once Supabase data is loaded; the last boot error (surfaced in /health).
let supabaseReady = false;
let supabaseBootError = "";

// Try to load Supabase data into the cache. On failure, stay UP (a crash-loop
// would just 502 the whole app) and DON'T persist writes until a load succeeds
// — so we never overwrite real rows with an empty cache. Keeps retrying.
async function tryLoadSupabase(): Promise<void> {
  try {
    memCache = normalize(await loadFromSupabase());
    supabaseReady = true;
    supabaseBootError = "";
    console.log("[Insyte] Persistence: Supabase (data survives redeploys)");
  } catch (err: any) {
    supabaseReady = false;
    supabaseBootError = err?.message || String(err);
    console.error("[Insyte] Supabase load failed (serving without persistence, will retry):", supabaseBootError);
    if (!memCache) memCache = JSON.parse(JSON.stringify(seedData));
  }
}

async function initStore(): Promise<void> {
  if (!supabaseEnabled()) {
    supabaseReady = false;
    console.log("[Insyte] Persistence: local db.json (set SUPABASE_URL to use Supabase)");
    return;
  }
  await tryLoadSupabase();
  // If the first load failed, keep retrying in the background so the service
  // heals itself once Supabase is reachable — without ever going down.
  if (!supabaseReady) {
    const timer = setInterval(async () => {
      if (supabaseReady) { clearInterval(timer); return; }
      await tryLoadSupabase();
    }, 15000);
    timer.unref?.();
  }
}

// Read the current database state (synchronous — from cache or the flat file)
function readDb(): DbSchema {
  if (supabaseEnabled()) {
    if (!memCache) memCache = JSON.parse(JSON.stringify(seedData));
    return memCache as DbSchema;
  }
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), "utf8");
      return JSON.parse(JSON.stringify(seedData));
    }
    return normalize(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
  } catch (error) {
    console.error("Error reading database file. Reverting to initial seeds.", error);
    return JSON.parse(JSON.stringify(seedData));
  }
}

// Today's date as YYYY-MM-DD (UTC)
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Update login streak: consecutive-day logic
function applyStreak(user: UserProfile): UserProfile {
  const today = todayStr();
  if (user.lastActiveDate === today) return user;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = user.lastActiveDate === yesterday ? (user.streak || 0) + 1 : 1;
  return { ...user, streak, lastActiveDate: today };
}

// Add XP and recompute level + rank (single source of truth for the formula).
function awardXp(user: UserProfile, amount: number): UserProfile {
  const xp = user.xp + amount;
  const level = Math.floor(xp / 1000) + 1;
  let rank = "Freshman Scholar";
  if (level >= 4) rank = "Elite Scholar";
  else if (level >= 3) rank = "Advanced Scholar";
  else if (level >= 2) rank = "Active Scholar";
  return { ...user, xp, level, rank };
}

// Push an in-app notification for a user
function notify(db: DbSchema, userId: string, type: AppNotification["type"], title: string, body: string) {
  db.notifications.push({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    type,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false
  });
  // Cap stored notifications so the flat file doesn't grow unbounded
  if (db.notifications.length > 500) {
    db.notifications = db.notifications.slice(-500);
  }
}

function findUserByEmail(db: DbSchema, email: string): UserProfile | undefined {
  const lower = email.trim().toLowerCase();
  return [...db.students, ...db.teachers].find(u => u.email.toLowerCase() === lower);
}

// ---- Response shaping: never serialize private fields to other users ----

// Public view of a user: no email, no password hash
function publicUser(u: UserProfile): Omit<UserProfile, "email" | "passwordHash"> {
  const { email, passwordHash, ...rest } = u;
  return rest;
}

// The signed-in user's own view: keeps email, drops the password hash
function selfUser(u: UserProfile): Omit<UserProfile, "passwordHash"> {
  const { passwordHash, ...rest } = u;
  return rest;
}

// Resolve the caller from their session token, or null if unauthenticated
function userFromToken(db: DbSchema, req: express.Request): UserProfile | null {
  const token = String(req.headers["x-auth-token"] || "");
  if (!token) return null;
  const userId = db.sessions[token];
  if (!userId) return null;
  return [...db.students, ...db.teachers].find(u => u.id === userId) || null;
}

// Public view of a submission: status only, no homework content or private feedback
function publicSubmission(s: TaskSubmission): Omit<TaskSubmission, "content" | "feedback"> {
  const { content, feedback, ...rest } = s;
  return rest;
}

// Mails visible to one user: sent or received by them
function mailsFor(db: DbSchema, userId: string): Mail[] {
  return db.mails.filter(m => m.fromId === userId || m.toId === userId);
}

function notificationsFor(db: DbSchema, userId: string): AppNotification[] {
  return db.notifications.filter(n => n.userId === userId);
}

// Full submissions a user is allowed to read: students see their own,
// teachers see submissions for classes they teach
function submissionsFor(db: DbSchema, user: UserProfile): TaskSubmission[] {
  if (user.role === "student") {
    return db.submissions.filter(s => s.studentId === user.id);
  }
  const myClassIds = new Set(db.classes.filter(c => c.teacherId === user.id).map(c => c.id));
  const myTaskIds = new Set(db.tasks.filter(t => myClassIds.has(t.classId)).map(t => t.id));
  return db.submissions.filter(s => myTaskIds.has(s.taskId));
}

// ---- URL validation for teacher-supplied lesson media ----

// Hosts allowed inside an <iframe> on the lesson page (matches the frontend CSP)
const EMBED_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "docs.google.com"
];

function isSafeEmbedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && EMBED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

function isSafeHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// Returns an error string for bad lesson media URLs, or null if all fine
function validateLessonUrls(body: { videoUrl?: string; pptUrl?: string; webUrl?: string }): string | null {
  if (body.videoUrl && !isSafeEmbedUrl(body.videoUrl)) {
    return "Video URL must be an https link to YouTube or Vimeo.";
  }
  if (body.pptUrl && !isSafeEmbedUrl(body.pptUrl)) {
    return "Slides URL must be an https link to Google Docs/Slides or YouTube.";
  }
  if (body.webUrl && !isSafeHttpUrl(body.webUrl)) {
    return "Web link must be a valid http(s) URL.";
  }
  return null;
}

function saveUser(db: DbSchema, user: UserProfile) {
  if (user.role === "student") {
    db.students = db.students.map(s => (s.id === user.id ? user : s));
  } else {
    db.teachers = db.teachers.map(t => (t.id === user.id ? user : t));
  }
}

// The community grade a class name belongs to: "Class 2B - German" -> "Class 2B"
function gradeOf(name: string): string {
  return name.includes(" - ") ? name.split(" - ")[0].trim() : name.trim();
}

// All class ids in the same community (grade) as the given class
function siblingClassIds(db: DbSchema, cls: ClassCommunity): string[] {
  const g = gradeOf(cls.name).toLowerCase();
  return db.classes.filter(c => gradeOf(c.name).toLowerCase() === g).map(c => c.id);
}

// Help helper to write database state
function writeDb(data: DbSchema) {
  if (supabaseEnabled()) {
    memCache = data;
    // Only persist once the initial load has succeeded. Writing while the real
    // rows aren't loaded could push a partial cache over the top of live data.
    if (supabaseReady) {
      saveToSupabase(data as any).catch(err =>
        console.error("[Insyte] Supabase save failed (data kept in memory):", err)
      );
    }
    return;
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write to local database file:", error);
  }
}

async function startServer() {
const app = express();
const PORT = 3000;

// Allow requests from the Vercel frontend + local dev
const ALLOWED_ORIGINS = [
  "https://insyte-1-4.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];
app.use((req, res, next) => {
  // CORS
  const origin = req.headers.origin || "";
  res.header(
    "Access-Control-Allow-Origin",
    ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  );
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,X-Auth-Token");

  // Security headers (production only — X-Frame-Options/CSP break local dev preview + Vite's inline preamble)
  res.header("X-Content-Type-Options", "nosniff");
  if (process.env.NODE_ENV === "production") {
    res.header("X-Frame-Options", "DENY");
    res.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://insyte-1-4.vercel.app"
    );
  }

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
// Middleware for parsing JSON requests
app.use(express.json());

// Railway sits behind a proxy; trust one hop so req.ip is the real client IP,
// not the proxy's — otherwise every visitor shares one rate-limit bucket
app.set("trust proxy", 1);

// Rate limits: generous for normal browsing, tight for auth endpoints
app.use("/api/", makeRateLimiter(5 * 60 * 1000, 300, "API"));
const authLimiter = makeRateLimiter(10 * 60 * 1000, 10, "sign-in");
app.use("/api/login", authLimiter);
app.use("/api/signup", authLimiter);

  // Load persisted state (Supabase or flat file) before serving
  await initStore();
  readDb();

  // -----------------------------------------------------
  // REST BACKEND API ENDPOINTS
  // -----------------------------------------------------

  // Get the shared portal state. Private data is excluded here:
  // no emails, no mail, no notifications, no homework content — those
  // are served per-user by GET /api/me/:userId.
  app.get("/api/data", (req, res) => {
    const db = readDb();
    res.json({
      students: db.students.map(publicUser),
      teachers: db.teachers.map(publicUser),
      classes: db.classes,
      lessons: db.lessons,
      tasks: db.tasks,
      announcements: db.announcements,
      chatMessages: db.chatMessages,
      events: db.events,
      submissions: db.submissions.map(publicSubmission)
    });
  });

  // Per-user private data: own profile (with email), mailbox, notifications,
  // and the full submissions this user may read.
  // Gate: a valid session token (X-Auth-Token) issued at login/signup.
  app.get("/api/me", (req, res) => {
    const db = readDb();
    const user = userFromToken(db, req);
    if (!user) {
      return res.status(401).json({ error: "Not signed in." });
    }
    res.json({
      user: selfUser(user),
      myMails: mailsFor(db, user.id),
      myNotifications: notificationsFor(db, user.id),
      mySubmissions: submissionsFor(db, user)
    });
  });

  // Sign up: create a fresh student or teacher account with a password
  app.post("/api/signup", (req, res) => {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: "Name, email, password, and role are required." });
    }
    if (role !== "student" && role !== "teacher") {
      return res.status(400).json({ error: "Role must be 'student' or 'teacher'." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const db = readDb();
    if (findUserByEmail(db, email)) {
      return res.status(409).json({ error: "An account with this email already exists. Log in instead." });
    }

    const newUser: UserProfile = {
      id: `${role}-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim(),
      role,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      xp: 0,
      level: role === "teacher" ? 10 : 1,
      rank: role === "teacher" ? "Educator" : "Freshman Scholar",
      joinedClasses: [], // Enrollment happens only via class code
      streak: 1,
      lastActiveDate: todayStr(),
      readLessons: [],
      passwordHash: hashPassword(String(password))
    };

    if (role === "student") db.students.push(newUser);
    else db.teachers.push(newUser);

    const token = newToken();
    db.sessions[token] = newUser.id;

    writeDb(db);
    res.status(201).json({
      token,
      user: selfUser(newUser),
      allStudents: db.students.map(publicUser),
      allTeachers: db.teachers.map(publicUser)
    });
  });

  // Log in with email + password; issues a session token and updates streak
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const db = readDb();
    const found = findUserByEmail(db, email);
    // Same message whether the email is unknown or the password is wrong,
    // so the response can't be used to discover which emails have accounts
    if (!found || !found.passwordHash || !verifyPassword(String(password), found.passwordHash)) {
      return res.status(401).json({ error: "Wrong email or password." });
    }

    let updated = applyStreak(found);
    // Daily attendance reward: first login of a new day gives students XP.
    // Guarded by lastActiveDate, so it can't be farmed by re-logging in.
    const isNewDay = updated.lastActiveDate !== found.lastActiveDate;
    let dailyXp = 0;
    if (isNewDay && updated.role === "student") {
      dailyXp = 20 + Math.min(30, (updated.streak - 1) * 5); // grows with streak, capped
      updated = awardXp(updated, dailyXp);
      notify(db, updated.id, "event", "Daily check-in", `+${dailyXp} XP — ${updated.streak}-day streak!`);
    }
    saveUser(db, updated);
    const token = newToken();
    db.sessions[token] = updated.id;
    writeDb(db);
    res.json({
      token,
      user: selfUser(updated),
      dailyXp,
      allStudents: db.students.map(publicUser),
      allTeachers: db.teachers.map(publicUser)
    });
  });

  // Update the signed-in user's profile photo (uploaded image as a data URL)
  app.post("/api/profile/avatar", async (req, res) => {
    const { avatar } = req.body;
    const db = readDb();
    const user = userFromToken(db, req);
    if (!user) {
      return res.status(401).json({ error: "Not signed in." });
    }
    if (typeof avatar !== "string" || !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(avatar)) {
      return res.status(400).json({ error: "Avatar must be an uploaded PNG, JPG, WEBP, or GIF image." });
    }
    // Cap at ~700KB of base64 so the flat file / DB row stays reasonable
    if (avatar.length > 700_000) {
      return res.status(413).json({ error: "Image too large. Please use one under ~500KB." });
    }

    // With Supabase, push the image to Storage and keep only its URL in the
    // row (small + fast). Without it, fall back to storing the data URL inline.
    let stored = avatar;
    if (supabaseEnabled()) {
      try {
        stored = await uploadAvatar(user.id, avatar);
      } catch (err) {
        console.error("[Insyte] Avatar storage upload failed, keeping inline:", err);
      }
    }

    const updated = { ...user, avatar: stored };
    saveUser(db, updated);
    writeDb(db);
    res.json({
      user: selfUser(updated),
      allStudents: db.students.map(publicUser),
      allTeachers: db.teachers.map(publicUser)
    });
  });

  // Log out: invalidate the presented session token
  app.post("/api/logout", (req, res) => {
    const token = String(req.headers["x-auth-token"] || "");
    if (token) {
      const db = readDb();
      if (db.sessions[token]) {
        delete db.sessions[token];
        writeDb(db);
      }
    }
    res.json({ ok: true });
  });

  // Join a class community using its class code
  // Join a community by code. Students enroll in every subject under it;
  // teachers become co-teachers (member via joinedClasses, ownership unchanged).
  app.post("/api/classes/join", (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "code is required." });
    }

    const db = readDb();
    const user = userFromToken(db, req);
    if (!user) {
      return res.status(401).json({ error: "Sign in required." });
    }
    const uid = user.id;
    const isStudent = user.role === "student";

    const target = db.classes.find(c => c.code.toLowerCase() === String(code).trim().toLowerCase());
    if (!target) {
      return res.status(404).json({ error: "No class found with this code. Double-check with your teacher." });
    }
    // Joining a community enrolls the user in every subject under it
    const communityIds = siblingClassIds(db, target);
    if (communityIds.every(id => user.joinedClasses.includes(id))) {
      return res.status(409).json({ error: "You are already a member of this community." });
    }

    const idSet = new Set(communityIds);
    const updatedUser = {
      ...user,
      joinedClasses: Array.from(new Set([...user.joinedClasses, ...communityIds]))
    };
    saveUser(db, updatedUser);
    if (isStudent) {
      db.classes = db.classes.map(c =>
        idSet.has(c.id)
          ? { ...c, studentIds: Array.from(new Set([...c.studentIds, uid])) }
          : c
      );
    }

    if (target.teacherId !== uid) {
      notify(
        db,
        target.teacherId,
        "join",
        isStudent ? "New student joined" : "Teacher joined your community",
        `${user.name} joined ${target.name}.`
      );
    }

    writeDb(db);
    res.json({
      // "student" kept for older deployed frontends; "user" is the same object
      user: selfUser(updatedUser),
      student: selfUser(updatedUser),
      allStudents: db.students.map(publicUser),
      allTeachers: db.teachers.map(publicUser),
      allClasses: db.classes,
      joinedClass: db.classes.find(c => c.id === target.id)
    });
  });

  // Award study XP points and trigger level up + ranking updates
  app.post("/api/students/add-xp", (req, res) => {
    const { studentId, xpAmount } = req.body;
    if (!studentId || typeof xpAmount !== "number") {
      return res.status(400).json({ error: "studentId and a numeric xpAmount are required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester) {
      return res.status(401).json({ error: "Sign in required." });
    }
    if (requester.role !== "teacher" && requester.id !== studentId) {
      return res.status(403).json({ error: "You can only award XP to yourself." });
    }
    let updatedStudent: UserProfile | null = null;

    db.students = db.students.map(stud => {
      if (stud.id === studentId) {
        const updatedXp = stud.xp + xpAmount;
        const updatedLvl = Math.floor(updatedXp / 1000) + 1;

        let rank = "Freshman Scholar";
        if (updatedLvl >= 4) rank = "Elite Scholar";
        else if (updatedLvl >= 3) rank = "Advanced Scholar";
        else if (updatedLvl >= 2) rank = "Active Scholar";

        updatedStudent = {
          ...stud,
          xp: updatedXp,
          level: updatedLvl,
          rank
        };
        return updatedStudent;
      }
      return stud;
    });

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found." });
    }

    writeDb(db);
    res.json({ student: selfUser(updatedStudent), allStudents: db.students.map(publicUser) });
  });

  // Mark a lesson read (student's own session). Idempotent: awards +25 XP
  // only the first time a given lesson id is marked for that student —
  // repeat calls (reopening the same lesson) return the student unchanged.
  app.post("/api/lessons/mark-read", (req, res) => {
    const { lessonId } = req.body;
    if (!lessonId) {
      return res.status(400).json({ error: "lessonId is required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "student") {
      return res.status(401).json({ error: "Student session required." });
    }

    if (requester.readLessons.includes(lessonId)) {
      return res.json({ student: selfUser(requester), allStudents: db.students.map(publicUser), alreadyRead: true });
    }

    const READ_XP = 25;
    let updatedStudent: UserProfile | null = null;
    db.students = db.students.map(stud => {
      if (stud.id !== requester.id) return stud;
      const updatedXp = stud.xp + READ_XP;
      const updatedLvl = Math.floor(updatedXp / 1000) + 1;
      let rank = "Freshman Scholar";
      if (updatedLvl >= 4) rank = "Elite Scholar";
      else if (updatedLvl >= 3) rank = "Advanced Scholar";
      else if (updatedLvl >= 2) rank = "Active Scholar";
      updatedStudent = {
        ...stud,
        xp: updatedXp,
        level: updatedLvl,
        rank,
        readLessons: [...stud.readLessons, lessonId]
      };
      return updatedStudent;
    });

    writeDb(db);
    res.json({ student: selfUser(updatedStudent!), allStudents: db.students.map(publicUser), alreadyRead: false });
  });

  // Self-service password change (student or teacher), requires proving the
  // current password. No admin-reset path exists: a locked-out user with a
  // truly forgotten password has no in-app recovery.
  app.post("/api/change-password", (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "currentPassword and a new password of at least 6 characters are required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester) {
      return res.status(401).json({ error: "Session required." });
    }
    if (!verifyPassword(currentPassword, requester.passwordHash || "")) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    saveUser(db, { ...requester, passwordHash: hashPassword(newPassword) });
    writeDb(db);
    res.json({ ok: true });
  });

  // Leave a class (unenroll a student from a classroom)
  app.post("/api/students/leave-class", (req, res) => {
    const { classId } = req.body;
    if (!classId) {
      return res.status(400).json({ error: "classId is required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "student") {
      return res.status(401).json({ error: "Student session required." });
    }
    const studentId = requester.id;
    let updatedStudent: UserProfile | null = null;

    db.students = db.students.map(stud => {
      if (stud.id === studentId) {
        updatedStudent = {
          ...stud,
          joinedClasses: stud.joinedClasses.filter(cId => cId !== classId)
        };
        return updatedStudent;
      }
      return stud;
    });

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found." });
    }

    // Remove the student from the classroom roster too
    db.classes = db.classes.map(cl =>
      cl.id === classId
        ? { ...cl, studentIds: cl.studentIds.filter(id => id !== studentId) }
        : cl
    );

    writeDb(db);
    res.json({ student: selfUser(updatedStudent), allStudents: db.students.map(publicUser), allClasses: db.classes });
  });

  // Create a brand new Class Community
  app.post("/api/classes", (req, res) => {
    const { name, code, description, color } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: "Class name and code are required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const teacher = db.teachers.find(t => t.id === requester.id);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found." });
    }
    if (db.classes.some(c => c.code.toLowerCase() === String(code).trim().toLowerCase())) {
      return res.status(409).json({ error: "This class code is already taken. Pick a different one." });
    }

    // A subject added inside an existing community inherits that community's
    // current students, so nobody has to re-join for each new subject.
    const communityStudentIds = Array.from(new Set(
      db.classes
        .filter(c => gradeOf(c.name).toLowerCase() === gradeOf(name).toLowerCase())
        .flatMap(c => c.studentIds)
    ));

    const newClass: ClassCommunity = {
      id: `class-${Date.now()}`,
      name,
      code: String(code).trim().toUpperCase(),
      description: description || "",
      teacherId: teacher.id,
      teacherName: teacher.name,
      studentIds: communityStudentIds,
      color: color || "indigo"
    };

    db.classes.push(newClass);

    // Enroll those inherited students' joinedClasses in the new subject too
    if (communityStudentIds.length > 0) {
      const idSet = new Set(communityStudentIds);
      db.students = db.students.map(s =>
        idSet.has(s.id)
          ? { ...s, joinedClasses: Array.from(new Set([...s.joinedClasses, newClass.id])) }
          : s
      );
    }

    // Teacher is a member of their own class
    db.teachers = db.teachers.map(t =>
      t.id === teacher.id
        ? { ...t, joinedClasses: Array.from(new Set([...t.joinedClasses, newClass.id])) }
        : t
    );

    writeDb(db);
    res.status(201).json({
      class: newClass,
      allClasses: db.classes,
      allStudents: db.students.map(publicUser),
      allTeachers: db.teachers.map(publicUser)
    });
  });

  // Publish a new lesson guide
  app.post("/api/lessons", (req, res) => {
    const { classId, title, content, videoUrl, pptUrl, webUrl, webUrlTitle } = req.body;
    if (!classId || !title || !content) {
      return res.status(400).json({ error: "classId, title, and content are required." });
    }
    const urlError = validateLessonUrls(req.body);
    if (urlError) {
      return res.status(400).json({ error: urlError });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const targetClass = db.classes.find(c => c.id === classId);
    if (!targetClass || targetClass.teacherId !== requester.id) {
      return res.status(403).json({ error: "You do not teach this class." });
    }
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      classId,
      title,
      content,
      publishedAt: new Date().toISOString(),
      videoUrl: videoUrl || "",
      pptUrl: pptUrl || "",
      webUrl: webUrl || "",
      webUrlTitle: webUrlTitle || ""
    };

    db.lessons.unshift(newLesson); // Prepend so most recent appears first
    writeDb(db);
    res.status(201).json(newLesson);
  });

  // Update an existing lesson guide
  app.put("/api/lessons/:id", (req, res) => {
    const { id } = req.params;
    const { title, content, videoUrl, pptUrl, webUrl, webUrlTitle } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required." });
    }
    const urlError = validateLessonUrls(req.body);
    if (urlError) {
      return res.status(400).json({ error: urlError });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const index = db.lessons.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Lesson not found." });
    }
    const ownerClass = db.classes.find(c => c.id === db.lessons[index].classId);
    if (!ownerClass || ownerClass.teacherId !== requester.id) {
      return res.status(403).json({ error: "You do not teach this class." });
    }

    db.lessons[index] = {
      ...db.lessons[index],
      title,
      content,
      videoUrl: videoUrl || "",
      pptUrl: pptUrl || "",
      webUrl: webUrl || "",
      webUrlTitle: webUrlTitle || ""
    };

    writeDb(db);
    res.json(db.lessons[index]);
  });

  // Delete an existing lesson guide
  app.delete("/api/lessons/:id", (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const existing = db.lessons.find(l => l.id === id);
    if (!existing) {
      return res.status(404).json({ error: "Lesson not found." });
    }
    const ownerClass = db.classes.find(c => c.id === existing.classId);
    if (!ownerClass || ownerClass.teacherId !== requester.id) {
      return res.status(403).json({ error: "You do not teach this class." });
    }
    db.lessons = db.lessons.filter(l => l.id !== id);

    writeDb(db);
    res.json({ success: true, message: "Lesson deleted successfully." });
  });

  // Publish a new homework assignment task
  app.post("/api/tasks", (req, res) => {
    const { classId, title, description, rewardXp, dueDate, type, dragItems, dropZones, correctPairing, quizQuestions } = req.body;
    if (!classId || !title || !description || !rewardXp || !dueDate || !type) {
      return res.status(400).json({ error: "Missing required task fields." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const taskClassCheck = db.classes.find(c => c.id === classId);
    if (!taskClassCheck || taskClassCheck.teacherId !== requester.id) {
      return res.status(403).json({ error: "You do not teach this class." });
    }
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      classId,
      title,
      description,
      rewardXp: Number(rewardXp),
      dueDate,
      type,
      dragItems,
      dropZones,
      correctPairing,
      quizQuestions
    };

    db.tasks.unshift(newTask);

    // Notify every student in the class about the new assignment
    const taskClass = db.classes.find(c => c.id === classId);
    for (const sid of taskClass?.studentIds || []) {
      notify(db, sid, "task", "New assignment", `${title} — due ${dueDate}, worth ${rewardXp} XP.`);
    }

    writeDb(db);
    res.status(201).json({ task: newTask, allNotifications: db.notifications });
  });

  // Broadcast peer classroom chat logs
  app.post("/api/classroom-chat", (req, res) => {
    const { classId, text } = req.body;
    if (!classId || !text) {
      return res.status(400).json({ error: "classId and text are required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester) {
      return res.status(401).json({ error: "Sign in required." });
    }
    const senderId = requester.id;
    const senderName = requester.name;
    const senderRole = requester.role;
    const senderAvatar = requester.avatar;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      classId,
      senderId,
      senderName,
      senderRole,
      senderAvatar,
      text,
      timestamp: new Date().toISOString()
    };

    db.chatMessages.push(newMsg);
    writeDb(db);
    res.status(201).json({ message: newMsg, allChatMessages: db.chatMessages });
  });

  // Broadcast high priority Announcements bulletins
  app.post("/api/announcements", (req, res) => {
    const { classId, title, content } = req.body;
    if (!classId || !title || !content) {
      return res.status(400).json({ error: "classId, title, and content are required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const annClassCheck = db.classes.find(c => c.id === classId);
    if (!annClassCheck || annClassCheck.teacherId !== requester.id) {
      return res.status(403).json({ error: "You do not teach this class." });
    }
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      classId,
      title,
      content,
      authorName: requester.name,
      publishedAt: new Date().toISOString()
    };

    db.announcements.unshift(newAnn);

    // Notify every student in the class
    const annClass = db.classes.find(c => c.id === classId);
    for (const sid of annClass?.studentIds || []) {
      notify(db, sid, "announcement", "New announcement", `${newAnn.authorName}: ${title}`);
    }

    writeDb(db);
    res.status(201).json({ announcement: newAnn, allNotifications: db.notifications });
  });

  // Schedule collaborative calendar events
  app.post("/api/events", (req, res) => {
    const { classId, title, description, date, time } = req.body;
    if (!classId || !title || !date || !time) {
      return res.status(400).json({ error: "classId, title, date, and time are required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const evtClassCheck = db.classes.find(c => c.id === classId);
    if (!evtClassCheck || evtClassCheck.teacherId !== requester.id) {
      return res.status(403).json({ error: "You do not teach this class." });
    }
    const newEvt: ClassEvent = {
      id: `evt-${Date.now()}`,
      classId,
      title,
      description: description || "",
      date,
      time
    };

    db.events.push(newEvt);
    writeDb(db);
    res.status(201).json(newEvt);
  });

  // Submit student Homework essays or matcher games
  app.post("/api/submissions", (req, res) => {
    const { taskId, taskTitle, content } = req.body;
    if (!taskId || !content) {
      return res.status(400).json({ error: "taskId and content are required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "student") {
      return res.status(401).json({ error: "Student session required." });
    }
    const studentId = requester.id;
    const newSubmission: TaskSubmission = {
      id: `sub-${Date.now()}`,
      taskId,
      taskTitle,
      studentId,
      studentName: requester.name,
      studentAvatar: requester.avatar,
      content,
      submittedAt: new Date().toISOString(),
      isGraded: false,
      scoreXpEarned: 0
    };

    db.submissions.push(newSubmission);
    writeDb(db);
    // Return only the submitting student's own submissions
    res.status(201).json({
      submission: newSubmission,
      mySubmissions: db.submissions.filter(s => s.studentId === studentId)
    });
  });

  // Grade student Homework task submission (and award study XP)
  app.post("/api/submissions/grade", (req, res) => {
    const { submissionId, scoreXp, feedback } = req.body;
    if (!submissionId || typeof scoreXp !== "number") {
      return res.status(400).json({ error: "submissionId and scoreXp are required parameters." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester || requester.role !== "teacher") {
      return res.status(401).json({ error: "Teacher session required." });
    }
    const targetSubmission = db.submissions.find(s => s.id === submissionId);
    if (!targetSubmission) {
      return res.status(404).json({ error: "Submission item not found." });
    }
    const gradeTask = db.tasks.find(t => t.id === targetSubmission.taskId);
    const gradeClass = gradeTask ? db.classes.find(c => c.id === gradeTask.classId) : null;
    if (!gradeClass || gradeClass.teacherId !== requester.id) {
      return res.status(403).json({ error: "You do not teach this class." });
    }

    let targetStudentId = "";
    let updatedSubmission: TaskSubmission | null = null;

    db.submissions = db.submissions.map(sub => {
      if (sub.id === submissionId) {
        targetStudentId = sub.studentId;
        updatedSubmission = {
          ...sub,
          isGraded: true,
          scoreXpEarned: scoreXp,
          feedback: feedback || ""
        };
        return updatedSubmission;
      }
      return sub;
    });

    if (!updatedSubmission) {
      return res.status(404).json({ error: "Submission item not found." });
    }

    // Award the XP to the student
    if (targetStudentId) {
      db.students = db.students.map(stud => {
        if (stud.id === targetStudentId) {
          const updatedXp = stud.xp + scoreXp;
          const updatedLvl = Math.floor(updatedXp / 1000) + 1;

          let rank = "Freshman Scholar";
          if (updatedLvl >= 4) rank = "Elite Scholar";
          else if (updatedLvl >= 3) rank = "Advanced Scholar";
          else if (updatedLvl >= 2) rank = "Active Scholar";

          return {
            ...stud,
            xp: updatedXp,
            level: updatedLvl,
            rank
          };
        }
        return stud;
      });
    }

    // Notify the graded student
    if (targetStudentId && updatedSubmission) {
      notify(
        db,
        targetStudentId,
        "grade",
        "Homework graded",
        `${(updatedSubmission as TaskSubmission).taskTitle}: +${scoreXp} XP.${feedback ? ` Feedback: ${feedback}` : ""}`
      );
    }

    writeDb(db);
    // Grader gets the updated submission; frontend patches it into state
    res.json({
      submission: updatedSubmission,
      allStudents: db.students.map(publicUser),
      studentId: targetStudentId
    });
  });

  // -----------------------------------------------------
  // INTEGRATED MAIL
  // -----------------------------------------------------

  // Send an in-app mail to another user
  app.post("/api/mail", (req, res) => {
    const { toId, subject, body } = req.body;
    if (!toId || !subject || !body) {
      return res.status(400).json({ error: "toId, subject, and body are required." });
    }

    const db = readDb();
    // Sender is whoever holds the token; can't spoof another sender
    const sender = userFromToken(db, req);
    if (!sender) {
      return res.status(401).json({ error: "Not signed in." });
    }
    const recipient = [...db.students, ...db.teachers].find(u => u.id === toId);
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found." });
    }

    const newMail: Mail = {
      id: `mail-${Date.now()}`,
      fromId: sender.id,
      fromName: sender.name,
      fromAvatar: sender.avatar,
      toId: recipient.id,
      toName: recipient.name,
      subject: String(subject).trim(),
      body: String(body).trim(),
      sentAt: new Date().toISOString(),
      read: false
    };

    db.mails.push(newMail);
    notify(db, recipient.id, "mail", "New mail", `${sender.name}: ${newMail.subject}`);

    writeDb(db);
    // Sender sees only their own mailbox
    res.status(201).json({ mail: newMail, myMails: mailsFor(db, sender.id) });
  });

  // Mark a mail as read (only the recipient, identified by their token)
  app.post("/api/mail/read", (req, res) => {
    const { mailId } = req.body;
    if (!mailId) {
      return res.status(400).json({ error: "mailId is required." });
    }

    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester) {
      return res.status(401).json({ error: "Not signed in." });
    }
    const mail = db.mails.find(m => m.id === mailId);
    if (!mail) {
      return res.status(404).json({ error: "Mail not found." });
    }
    if (mail.toId !== requester.id) {
      return res.status(403).json({ error: "Only the recipient can mark this mail as read." });
    }

    db.mails = db.mails.map(m => (m.id === mailId ? { ...m, read: true } : m));
    writeDb(db);
    res.json({ myMails: mailsFor(db, requester.id) });
  });

  // Mark all of the caller's notifications as read
  app.post("/api/notifications/read", (req, res) => {
    const db = readDb();
    const requester = userFromToken(db, req);
    if (!requester) {
      return res.status(401).json({ error: "Not signed in." });
    }
    db.notifications = db.notifications.map(n =>
      n.userId === requester.id ? { ...n, read: true } : n
    );
    writeDb(db);
    res.json({ myNotifications: notificationsFor(db, requester.id) });
  });

  // Health check endpoint (storage tells you if data survives redeploys, and
  // surfaces the exact Supabase boot error so we can diagnose without logs).
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      storage: !supabaseEnabled()
        ? "file (wiped on redeploy!)"
        : (supabaseReady ? "supabase (persistent)" : "supabase-configured-but-load-FAILED"),
      supabaseReady,
      supabaseBootError: supabaseBootError || undefined,
      timestamp: new Date().toISOString()
    });
  });

  // Gemini Study Buddy Chat endpoint (Securely Proxied)
  app.post("/api/chat", async (req, res) => {
    try {
      const db0 = readDb();
      if (!userFromToken(db0, req)) {
        return res.status(401).json({ error: "Sign in required." });
      }
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(400).json({
          error: "GEMINI_API_KEY environment variable is not configured. Please add your Gemini API Key in Settings > Secrets."
        });
      }

      const { messages, systemPrompt } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid 'messages' format. Must be an array." });
      }

      // Initialize GoogleGenAI with custom headers for telemetry
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Map roles from UI structure (user / assistant) to Gemini SDK structure (user / model)
      let contents = messages.map((msg: any) => ({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text || msg.content }]
      }));

      // The Gemini API requires the first turn in a multi-turn contents array to be from 'user'.
      // If the conversation starts with a static assistant/model welcome greeting, discard leading 'model' messages.
      while (contents.length > 0 && contents[0].role !== 'user') {
        contents.shift();
      }

      // Request content generation with automatic retry and model fallback (e.g., to gemini-3.1-flash-lite if gemini-3.5-flash is temporarily unavailable/loaded)
      const generateWithRetryAndFallback = async () => {
        const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
        let lastError: any = null;

        for (const model of modelsToTry) {
          const maxRetries = 2;
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`Calling Gemini API using model: ${model} (attempt ${attempt}/${maxRetries})`);
              const resObj = await ai.models.generateContent({
                model,
                contents,
                config: {
                  systemInstruction: systemPrompt || "You are a helpful educational tutor named Insyte AI.",
                  temperature: 0.7,
                  maxOutputTokens: 800,
                }
              });
              return resObj;
            } catch (err: any) {
              lastError = err;
              const errMsg = err.message || "";
              console.warn(`Attempt ${attempt} with model ${model} failed:`, errMsg);

              const isTransient = errMsg.includes('503') || 
                                  errMsg.includes('UNAVAILABLE') || 
                                  errMsg.includes('429') || 
                                  errMsg.includes('Resource Exhausted') ||
                                  err.status === 503 || 
                                  err.status === 429;

              if (!isTransient) {
                // For non-transient errors (e.g., invalid payload, structural errors, permission issues), break immediately
                break;
              }

              if (attempt < maxRetries) {
                // Wait briefly before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
        }
        throw lastError;
      };

      const response = await generateWithRetryAndFallback();
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error communicating with Gemini API:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred while communicating with the AI Study Buddy."
      });
    }
  });

  // Vite integration and Asset serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    // Lazy imports: only dev needs vite/tailwind, so production/Railway can run
    // without them installed. configFile:false + no react plugin because the
    // react-refresh inline preamble is blocked by strict CSP in the dev pane.
    const { createServer: createViteServer } = await import("vite");
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    const vite = await createViteServer({
      configFile: false,
      plugins: [tailwindcss()],
      esbuild: { jsx: "automatic" },
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode (API + static fallback)...");
    // The real frontend is served by Vercel; Railway serves the API. If a built
    // frontend exists it's served too, but its absence must not crash the app.
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtml = path.join(distPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => res.sendFile(indexHtml));
    } else {
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) return res.status(404).json({ error: "Not found." });
        res.status(200).send("insyte API server. The app is at https://insyte-1-4.vercel.app");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Insyte Server] Ready! Access it at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the Express server:", err);
  process.exit(1);
});
