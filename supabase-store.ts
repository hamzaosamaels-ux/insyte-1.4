// ============================================================================
// Supabase-backed persistence for the whole DbSchema.
//
// Design goal: change the storage layer, not the ~25 endpoints. The server
// keeps working with one big DbSchema object (readDb/writeDb). Here we load
// that object from Supabase tables and save it back, mapping snake_case DB
// columns <-> camelCase TypeScript fields.
//
// Active only when SUPABASE_URL and SUPABASE_SERVICE_KEY are set. Otherwise the
// server falls back to the local db.json file, so nothing breaks without keys.
// ============================================================================
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// These structural types mirror server.ts. Kept loose (any rows) on purpose so
// this file has no hard import cycle with server.ts.
export interface StoreSchema {
  students: any[];
  teachers: any[];
  classes: any[];
  lessons: any[];
  tasks: any[];
  announcements: any[];
  chatMessages: any[];
  events: any[];
  submissions: any[];
  mails: any[];
  notifications: any[];
  sessions: Record<string, string>;
}

let client: SupabaseClient | null = null;

export function supabaseEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function db(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_KEY as string,
      { auth: { persistSession: false } }
    );
  }
  return client;
}

// ---- column mapping: DB row (snake_case) -> app object (camelCase) ----

const rowToProfile = (r: any) => ({
  id: r.id, name: r.name, email: r.email, role: r.role, avatar: r.avatar,
  xp: r.xp, level: r.level, rank: r.rank, joinedClasses: r.joined_classes || [],
  streak: r.streak, lastActiveDate: r.last_active_date || "",
  passwordHash: r.password_hash || undefined
});
const profileToRow = (p: any) => ({
  id: p.id, name: p.name, email: p.email, role: p.role, avatar: p.avatar,
  xp: p.xp, level: p.level, rank: p.rank, joined_classes: p.joinedClasses || [],
  streak: p.streak ?? 0, last_active_date: p.lastActiveDate || "",
  password_hash: p.passwordHash || null
});

const rowToClass = (r: any) => ({
  id: r.id, name: r.name, code: r.code, description: r.description,
  teacherId: r.teacher_id, teacherName: r.teacher_name,
  studentIds: r.student_ids || [], color: r.color
});
const classToRow = (c: any) => ({
  id: c.id, name: c.name, code: c.code, description: c.description || "",
  teacher_id: c.teacherId, teacher_name: c.teacherName,
  student_ids: c.studentIds || [], color: c.color || "indigo"
});

const rowToLesson = (r: any) => ({
  id: r.id, classId: r.class_id, title: r.title, content: r.content,
  publishedAt: r.published_at, videoUrl: r.video_url || "", pptUrl: r.ppt_url || "",
  webUrl: r.web_url || "", webUrlTitle: r.web_url_title || ""
});
const lessonToRow = (l: any) => ({
  id: l.id, class_id: l.classId, title: l.title, content: l.content,
  published_at: l.publishedAt, video_url: l.videoUrl || "", ppt_url: l.pptUrl || "",
  web_url: l.webUrl || "", web_url_title: l.webUrlTitle || ""
});

const rowToTask = (r: any) => ({
  id: r.id, classId: r.class_id, title: r.title, description: r.description,
  rewardXp: r.reward_xp, dueDate: r.due_date, type: r.type,
  dragItems: r.drag_items || undefined, dropZones: r.drop_zones || undefined,
  correctPairing: r.correct_pairing || undefined
});
const taskToRow = (t: any) => ({
  id: t.id, class_id: t.classId, title: t.title, description: t.description,
  reward_xp: t.rewardXp, due_date: t.dueDate, type: t.type,
  drag_items: t.dragItems || null, drop_zones: t.dropZones || null,
  correct_pairing: t.correctPairing || null
});

const rowToSub = (r: any) => ({
  id: r.id, taskId: r.task_id, taskTitle: r.task_title, studentId: r.student_id,
  studentName: r.student_name, studentAvatar: r.student_avatar, content: r.content,
  submittedAt: r.submitted_at, isGraded: r.is_graded,
  scoreXpEarned: r.score_xp_earned, feedback: r.feedback || undefined
});
const subToRow = (s: any) => ({
  id: s.id, task_id: s.taskId, task_title: s.taskTitle, student_id: s.studentId,
  student_name: s.studentName, student_avatar: s.studentAvatar || "", content: s.content || "",
  submitted_at: s.submittedAt, is_graded: s.isGraded,
  score_xp_earned: s.scoreXpEarned || 0, feedback: s.feedback || null
});

const rowToAnn = (r: any) => ({
  id: r.id, classId: r.class_id, title: r.title, content: r.content,
  authorName: r.author_name, publishedAt: r.published_at
});
const annToRow = (a: any) => ({
  id: a.id, class_id: a.classId, title: a.title, content: a.content,
  author_name: a.authorName, published_at: a.publishedAt
});

const rowToMsg = (r: any) => ({
  id: r.id, classId: r.class_id, senderId: r.sender_id, senderName: r.sender_name,
  senderRole: r.sender_role, senderAvatar: r.sender_avatar, text: r.text, timestamp: r.timestamp
});
const msgToRow = (m: any) => ({
  id: m.id, class_id: m.classId, sender_id: m.senderId, sender_name: m.senderName,
  sender_role: m.senderRole, sender_avatar: m.senderAvatar || "", text: m.text, timestamp: m.timestamp
});

const rowToEvent = (r: any) => ({
  id: r.id, classId: r.class_id, title: r.title, description: r.description,
  date: r.date, time: r.time
});
const eventToRow = (e: any) => ({
  id: e.id, class_id: e.classId, title: e.title, description: e.description || "",
  date: e.date, time: e.time
});

const rowToMail = (r: any) => ({
  id: r.id, fromId: r.from_id, fromName: r.from_name, fromAvatar: r.from_avatar,
  toId: r.to_id, toName: r.to_name, subject: r.subject, body: r.body,
  sentAt: r.sent_at, read: r.read
});
const mailToRow = (m: any) => ({
  id: m.id, from_id: m.fromId, from_name: m.fromName, from_avatar: m.fromAvatar || "",
  to_id: m.toId, to_name: m.toName, subject: m.subject, body: m.body,
  sent_at: m.sentAt, read: m.read
});

const rowToNotif = (r: any) => ({
  id: r.id, userId: r.user_id, type: r.type, title: r.title, body: r.body,
  createdAt: r.created_at, read: r.read
});
const notifToRow = (n: any) => ({
  id: n.id, user_id: n.userId, type: n.type, title: n.title, body: n.body,
  created_at: n.createdAt, read: n.read
});

async function selectAll(table: string): Promise<any[]> {
  const { data, error } = await db().from(table).select("*");
  if (error) throw new Error(`Supabase read ${table}: ${error.message}`);
  return data || [];
}

// Load the whole schema from Supabase into the in-memory shape the server uses.
export async function loadFromSupabase(): Promise<StoreSchema> {
  const [profiles, classes, lessons, tasks, submissions, announcements, chat, events, mails, notifications, sessions] =
    await Promise.all([
      selectAll("profiles"), selectAll("classes"), selectAll("lessons"),
      selectAll("tasks"), selectAll("submissions"), selectAll("announcements"),
      selectAll("chat_messages"), selectAll("events"), selectAll("mails"),
      selectAll("notifications"), selectAll("sessions")
    ]);

  const profileObjs = profiles.map(rowToProfile);
  const sessionMap: Record<string, string> = {};
  for (const s of sessions) sessionMap[s.token] = s.user_id;

  return {
    students: profileObjs.filter(p => p.role === "student"),
    teachers: profileObjs.filter(p => p.role === "teacher"),
    classes: classes.map(rowToClass),
    lessons: lessons.map(rowToLesson),
    tasks: tasks.map(rowToTask),
    submissions: submissions.map(rowToSub),
    announcements: announcements.map(rowToAnn),
    chatMessages: chat.map(rowToMsg),
    events: events.map(rowToEvent),
    mails: mails.map(rowToMail),
    notifications: notifications.map(rowToNotif),
    sessions: sessionMap
  };
}

// Replace a table's rows with exactly the given set: upsert current rows, then
// delete any row whose id is no longer present. Keeps Supabase in sync with the
// in-memory object without tracking per-field deltas.
async function syncTable(table: string, rows: any[], idField = "id") {
  if (rows.length > 0) {
    const { error } = await db().from(table).upsert(rows);
    if (error) throw new Error(`Supabase upsert ${table}: ${error.message}`);
  }
  const keep = rows.map(r => r[idField]);
  let q = db().from(table).delete();
  // delete rows not in the keep-set (or all rows if the set is empty)
  q = keep.length > 0 ? q.not(idField, "in", `(${keep.map(k => `"${k}"`).join(",")})`) : q.neq(idField, " ");
  const { error } = await q;
  if (error) throw new Error(`Supabase prune ${table}: ${error.message}`);
}

// Upload a profile photo (data URL) to Supabase Storage and return its public
// URL, instead of storing the heavy base64 string in the database row.
let avatarBucketReady = false;
export async function uploadAvatar(userId: string, dataUrl: string): Promise<string> {
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("avatar must be a base64 image data URL");
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const buffer = Buffer.from(m[2], "base64");

  const bucket = "avatars";
  if (!avatarBucketReady) {
    // Create the public bucket once; ignore "already exists"
    await db().storage.createBucket(bucket, { public: true }).catch(() => {});
    avatarBucketReady = true;
  }

  const path = `${userId}-${Date.now()}.${ext}`;
  const { error } = await db().storage.from(bucket).upload(path, buffer, {
    contentType: `image/${m[1]}`,
    upsert: true
  });
  if (error) throw new Error(`Supabase avatar upload: ${error.message}`);
  return db().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// Persist the whole in-memory schema back to Supabase.
export async function saveToSupabase(data: StoreSchema): Promise<void> {
  const profileRows = [...data.students, ...data.teachers].map(profileToRow);
  const sessionRows = Object.entries(data.sessions || {}).map(([token, user_id]) => ({ token, user_id }));

  await Promise.all([
    syncTable("profiles", profileRows),
    syncTable("classes", data.classes.map(classToRow)),
    syncTable("lessons", data.lessons.map(lessonToRow)),
    syncTable("tasks", data.tasks.map(taskToRow)),
    syncTable("submissions", data.submissions.map(subToRow)),
    syncTable("announcements", data.announcements.map(annToRow)),
    syncTable("chat_messages", data.chatMessages.map(msgToRow)),
    syncTable("events", data.events.map(eventToRow)),
    syncTable("mails", data.mails.map(mailToRow)),
    syncTable("notifications", data.notifications.map(notifToRow)),
    syncTable("sessions", sessionRows, "token")
  ]);
}
