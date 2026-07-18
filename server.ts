import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const DB_FILE = path.join(process.cwd(), "db.json");

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
  type: "text" | "dragdrop";
  dragItems?: string[];
  dropZones?: string[];
  correctPairing?: Record<string, string>;
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
  notifications: []
};

// Help helper to get database state
function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), "utf8");
      return JSON.parse(JSON.stringify(seedData));
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    const db = JSON.parse(data);

    // Migrate old db.json shapes: single `teacher` object, missing arrays
    if (db.teacher && !db.teachers) {
      db.teachers = [db.teacher];
      delete db.teacher;
    }
    for (const key of Object.keys(seedData) as (keyof DbSchema)[]) {
      if (!Array.isArray(db[key])) db[key] = [];
    }
    for (const user of [...db.students, ...db.teachers]) {
      if (typeof user.streak !== "number") user.streak = 0;
      if (!user.lastActiveDate) user.lastActiveDate = "";
    }
    return db;
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

function saveUser(db: DbSchema, user: UserProfile) {
  if (user.role === "student") {
    db.students = db.students.map(s => (s.id === user.id ? user : s));
  } else {
    db.teachers = db.teachers.map(t => (t.id === user.id ? user : t));
  }
}

// Help helper to write database state
function writeDb(data: DbSchema) {
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
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

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

  // Ensure DB file exists at boot
  readDb();

  // -----------------------------------------------------
  // REST BACKEND API ENDPOINTS
  // -----------------------------------------------------

  // Get complete educational portal data state
  app.get("/api/data", (req, res) => {
    const db = readDb();
    res.json(db);
  });

  // Sign up: create a fresh student or teacher account (no premade profiles)
  app.post("/api/signup", (req, res) => {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email, and role are required." });
    }
    if (role !== "student" && role !== "teacher") {
      return res.status(400).json({ error: "Role must be 'student' or 'teacher'." });
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
      lastActiveDate: todayStr()
    };

    if (role === "student") db.students.push(newUser);
    else db.teachers.push(newUser);

    writeDb(db);
    res.status(201).json({ user: newUser, allStudents: db.students, allTeachers: db.teachers });
  });

  // Log in by email; updates the daily streak
  app.post("/api/login", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const db = readDb();
    const found = findUserByEmail(db, email);
    if (!found) {
      return res.status(404).json({ error: "No account found with this email. Sign up first." });
    }

    const updated = applyStreak(found);
    saveUser(db, updated);
    writeDb(db);
    res.json({ user: updated, allStudents: db.students, allTeachers: db.teachers });
  });

  // Join a class community using its class code
  app.post("/api/classes/join", (req, res) => {
    const { studentId, code } = req.body;
    if (!studentId || !code) {
      return res.status(400).json({ error: "studentId and code are required." });
    }

    const db = readDb();
    const student = db.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    const target = db.classes.find(c => c.code.toLowerCase() === String(code).trim().toLowerCase());
    if (!target) {
      return res.status(404).json({ error: "No class found with this code. Double-check with your teacher." });
    }
    if (student.joinedClasses.includes(target.id)) {
      return res.status(409).json({ error: "You are already a member of this class." });
    }

    const updatedStudent = { ...student, joinedClasses: [...student.joinedClasses, target.id] };
    saveUser(db, updatedStudent);
    db.classes = db.classes.map(c =>
      c.id === target.id
        ? { ...c, studentIds: Array.from(new Set([...c.studentIds, studentId])) }
        : c
    );

    notify(db, target.teacherId, "join", "New student joined", `${student.name} joined ${target.name}.`);

    writeDb(db);
    res.json({
      student: updatedStudent,
      allStudents: db.students,
      allClasses: db.classes,
      allNotifications: db.notifications,
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
    res.json({ student: updatedStudent, allStudents: db.students });
  });

  // Leave a class (unenroll a student from a classroom)
  app.post("/api/students/leave-class", (req, res) => {
    const { studentId, classId } = req.body;
    if (!studentId || !classId) {
      return res.status(400).json({ error: "studentId and classId are required." });
    }

    const db = readDb();
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
    res.json({ student: updatedStudent, allStudents: db.students, allClasses: db.classes });
  });

  // Create a brand new Class Community
  app.post("/api/classes", (req, res) => {
    const { name, code, description, teacherId, teacherName, color } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: "Class name and code are required." });
    }

    if (!teacherId) {
      return res.status(400).json({ error: "teacherId is required." });
    }

    const db = readDb();
    const teacher = db.teachers.find(t => t.id === teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found." });
    }
    if (db.classes.some(c => c.code.toLowerCase() === String(code).trim().toLowerCase())) {
      return res.status(409).json({ error: "This class code is already taken. Pick a different one." });
    }

    const newClass: ClassCommunity = {
      id: `class-${Date.now()}`,
      name,
      code: String(code).trim().toUpperCase(),
      description: description || "",
      teacherId: teacher.id,
      teacherName: teacherName || teacher.name,
      studentIds: [], // Students enroll themselves with the class code
      color: color || "indigo"
    };

    db.classes.push(newClass);

    // Teacher is a member of their own class
    db.teachers = db.teachers.map(t =>
      t.id === teacher.id
        ? { ...t, joinedClasses: Array.from(new Set([...t.joinedClasses, newClass.id])) }
        : t
    );

    writeDb(db);
    res.status(201).json({ class: newClass, allClasses: db.classes, allTeachers: db.teachers });
  });

  // Publish a new lesson guide
  app.post("/api/lessons", (req, res) => {
    const { classId, title, content, videoUrl, pptUrl, webUrl, webUrlTitle } = req.body;
    if (!classId || !title || !content) {
      return res.status(400).json({ error: "classId, title, and content are required." });
    }

    const db = readDb();
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

    const db = readDb();
    const index = db.lessons.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Lesson not found." });
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
    const initialLength = db.lessons.length;
    db.lessons = db.lessons.filter(l => l.id !== id);

    if (db.lessons.length === initialLength) {
      return res.status(404).json({ error: "Lesson not found." });
    }

    writeDb(db);
    res.json({ success: true, message: "Lesson deleted successfully." });
  });

  // Publish a new homework assignment task
  app.post("/api/tasks", (req, res) => {
    const { classId, title, description, rewardXp, dueDate, type, dragItems, dropZones, correctPairing } = req.body;
    if (!classId || !title || !description || !rewardXp || !dueDate || !type) {
      return res.status(400).json({ error: "Missing required task fields." });
    }

    const db = readDb();
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
      correctPairing
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
    const { classId, senderId, senderName, senderRole, senderAvatar, text } = req.body;
    if (!classId || !senderId || !text) {
      return res.status(400).json({ error: "classId, senderId, and text are required." });
    }

    const db = readDb();
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
    const { classId, title, content, authorName } = req.body;
    if (!classId || !title || !content) {
      return res.status(400).json({ error: "classId, title, and content are required." });
    }

    const db = readDb();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      classId,
      title,
      content,
      authorName: authorName || db.classes.find(c => c.id === classId)?.teacherName || "Teacher",
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
    const { taskId, taskTitle, studentId, studentName, studentAvatar, content } = req.body;
    if (!taskId || !studentId || !content) {
      return res.status(400).json({ error: "taskId, studentId, and content are required." });
    }

    const db = readDb();
    const newSubmission: TaskSubmission = {
      id: `sub-${Date.now()}`,
      taskId,
      taskTitle,
      studentId,
      studentName,
      studentAvatar,
      content,
      submittedAt: new Date().toISOString(),
      isGraded: false,
      scoreXpEarned: 0
    };

    db.submissions.push(newSubmission);
    writeDb(db);
    res.status(201).json({ submission: newSubmission, allSubmissions: db.submissions });
  });

  // Grade student Homework task submission (and award study XP)
  app.post("/api/submissions/grade", (req, res) => {
    const { submissionId, scoreXp, feedback } = req.body;
    if (!submissionId || typeof scoreXp !== "number") {
      return res.status(400).json({ error: "submissionId and scoreXp are required parameters." });
    }

    const db = readDb();
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
    res.json({
      submission: updatedSubmission,
      allSubmissions: db.submissions,
      allStudents: db.students,
      allNotifications: db.notifications,
      studentId: targetStudentId
    });
  });

  // -----------------------------------------------------
  // INTEGRATED MAIL
  // -----------------------------------------------------

  // Send an in-app mail to another user
  app.post("/api/mail", (req, res) => {
    const { fromId, toId, subject, body } = req.body;
    if (!fromId || !toId || !subject || !body) {
      return res.status(400).json({ error: "fromId, toId, subject, and body are required." });
    }

    const db = readDb();
    const allUsers = [...db.students, ...db.teachers];
    const sender = allUsers.find(u => u.id === fromId);
    const recipient = allUsers.find(u => u.id === toId);
    if (!sender || !recipient) {
      return res.status(404).json({ error: "Sender or recipient not found." });
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
    res.status(201).json({ mail: newMail, allMails: db.mails, allNotifications: db.notifications });
  });

  // Mark a mail as read
  app.post("/api/mail/read", (req, res) => {
    const { mailId } = req.body;
    if (!mailId) {
      return res.status(400).json({ error: "mailId is required." });
    }

    const db = readDb();
    const exists = db.mails.some(m => m.id === mailId);
    if (!exists) {
      return res.status(404).json({ error: "Mail not found." });
    }

    db.mails = db.mails.map(m => (m.id === mailId ? { ...m, read: true } : m));
    writeDb(db);
    res.json({ allMails: db.mails });
  });

  // Mark all of a user's notifications as read
  app.post("/api/notifications/read", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const db = readDb();
    db.notifications = db.notifications.map(n =>
      n.userId === userId ? { ...n, read: true } : n
    );
    writeDb(db);
    res.json({ allNotifications: db.notifications });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Gemini Study Buddy Chat endpoint (Securely Proxied)
  app.post("/api/chat", async (req, res) => {
    try {
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
    // configFile: false + no react plugin: the react-refresh preamble is an inline
    // script that strict CSP environments block, leaving a blank page in dev.
    // esbuild transforms TSX itself; we only lose fast-refresh (full reload instead).
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
    console.log("Starting server in production mode serving compiled assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Insyte Server] Ready! Access it at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start the Express server:", err);
  process.exit(1);
});
