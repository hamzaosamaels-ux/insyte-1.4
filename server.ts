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
}

interface ClassCommunity {
  id: string;
  name: string;
  code: string;
  description: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
}

interface Lesson {
  id: string;
  classId: string;
  title: string;
  content: string;
  publishedAt: string;
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
  teacher: UserProfile;
  classes: ClassCommunity[];
  lessons: Lesson[];
  tasks: TaskItem[];
  announcements: Announcement[];
  chatMessages: ChatMessage[];
  events: ClassEvent[];
  submissions: TaskSubmission[];
}

// Initial Seed Data if DB_FILE doesn't exist yet
const seedData: DbSchema = {
  students: [
    {
      id: "student-1",
      name: "Alex Rivera",
      email: "alex@insyte.edu",
      role: "student",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      xp: 2450,
      level: 3,
      rank: "Advanced Scholar",
      joinedClasses: ["class-1", "class-2", "class-3", "class-4"]
    },
    {
      id: "student-2",
      name: "Chloe Chen",
      email: "chloe@insyte.edu",
      role: "student",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe",
      xp: 3200,
      level: 4,
      rank: "Elite Scholar",
      joinedClasses: ["class-1", "class-3"]
    },
    {
      id: "student-3",
      name: "Marcus Vance",
      email: "marcus@insyte.edu",
      role: "student",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus",
      xp: 1850,
      level: 2,
      rank: "Active Scholar",
      joinedClasses: ["class-1", "class-2", "class-3", "class-4"]
    },
    {
      id: "student-4",
      name: "Sophia Martinez",
      email: "sophia@insyte.edu",
      role: "student",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia",
      xp: 1200,
      level: 2,
      rank: "Active Scholar",
      joinedClasses: ["class-2", "class-4"]
    }
  ],
  teacher: {
    id: "teacher-1",
    name: "Prof. Hamza",
    email: "hamza@insyte.edu",
    role: "teacher",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hamza",
    xp: 0,
    level: 10,
    rank: "Master Educator",
    joinedClasses: ["class-1", "class-2", "class-3", "class-4"]
  },
  classes: [
    {
      id: "class-1",
      name: "Class 2B - German",
      code: "GERM2B",
      description: "German language and literature class for Class 2B. Learn vocabulary, basic grammar rules, and common greetings.",
      teacherId: "teacher-1",
      teacherName: "Prof. Hamza",
      studentIds: ["student-1", "student-2", "student-3"],
      color: "emerald"
    },
    {
      id: "class-2",
      name: "Class 2B - Math",
      code: "MATH2B",
      description: "Mathematics and logical arithmetic class for Class 2B. Focuses on fractions, simple division, and equations.",
      teacherId: "teacher-1",
      teacherName: "Prof. Hamza",
      studentIds: ["student-1", "student-3", "student-4"],
      color: "violet"
    },
    {
      id: "class-3",
      name: "Class 3A - Science",
      code: "SCI3A",
      description: "Explore the exciting world of Science, physics, and biological ecosystems for Class 3A.",
      teacherId: "teacher-1",
      teacherName: "Prof. Hamza",
      studentIds: ["student-1", "student-2", "student-3"],
      color: "sky"
    },
    {
      id: "class-4",
      name: "Class 3A - History",
      code: "HIST3A",
      description: "Journey through ancient civilizations, medieval conflicts, and modern revolutions in Class 3A History.",
      teacherId: "teacher-1",
      teacherName: "Prof. Hamza",
      studentIds: ["student-1", "student-3", "student-4"],
      color: "rose"
    }
  ],
  lessons: [
    {
      id: "lesson-1",
      classId: "class-1",
      title: "1. Basic German Greetings",
      content: `## Guten Tag! Welcome to Class 2B German!\nIn this lesson, we will explore core greetings that form the foundation of conversational German:\n\n### 1. Guten Tag (Good day / Hello)\nThe most common polite greeting used throughout Germany. You can use it with anyone from teachers to shopkeepers!\n\n### 2. Guten Morgen (Good morning)\nUsed typically until about 11 AM to wish someone a wonderful morning.\n\n### 3. Danke & Bitte (Thank you & Please)\nPolite conversational keywords. 'Bitte' also doubles as 'You are welcome' when someone says 'Danke'.\n\n### 4. Auf Wiedersehen (Goodbye)\nA slightly formal but very polite way to say goodbye, literally meaning 'Until we see each other again'.\n\n### Summary Dialogue\n- **A**: Guten Tag, wie geht es dir? (Hello, how are you?)\n- **B**: Mir geht es gut, danke! Und dir? (I am doing well, thank you! And you?)`,
      publishedAt: "2026-07-10T09:00:00Z",
      videoUrl: "https://www.youtube.com/embed/g93UfP699sA",
      webUrl: "https://www.germanpod101.com",
      webUrlTitle: "GermanPod101 Pronunciation Guide"
    },
    {
      id: "lesson-2",
      classId: "class-1",
      title: "2. German Nouns and Genders",
      content: `## Noun Genders in German\nUnlike English, German nouns can be masculine, feminine, or neuter, and require different definite articles ('the'):\n\n### 1. Masculine: Der\nUsed for masculine nouns.\n- *der Mann* (the man)\n- *der Hund* (the dog)\n\n### 2. Feminine: Die\nUsed for feminine nouns.\n- *die Frau* (the woman)\n- *die Katze* (the cat)\n\n### 3. Neuter: Das\nUsed for neuter nouns.\n- *das Kind* (the child)\n- *das Buch* (the book)\n\n### Key Rule\nAlways learn a new German noun alongside its corresponding article (*der, die, or das*)!`,
      publishedAt: "2026-07-12T10:30:00Z"
    },
    {
      id: "lesson-3",
      classId: "class-2",
      title: "1. Understanding Fractions",
      content: `## Introduction to Fractions\nFractions are used to represent a portion or a part of a whole quantity.\n\n### Anatomy of a Fraction\n- **Numerator** (the top number): Indicates how many parts of the whole we are actively considering.\n- **Denominator** (the bottom number): Indicates how many equal parts the whole is divided into.\n\n### Visualization\nImagine a large delicious pizza sliced into **4 equal parts**:\n- If you eat 1 slice, you have consumed **1/4** of the pizza.\n- If Chloe eats 2 slices, she has consumed **2/4** (which simplifies to **1/2**) of the pizza.\n- The denominator remains 4 because the pizza is always cut into 4 total slices.\n\n### Word Problem\nIf a chocolate bar has 6 blocks, and you eat 3 blocks, you have eaten 3/6 (or 1/2) of the bar!`,
      publishedAt: "2026-07-11T14:00:00Z",
      videoUrl: "https://www.youtube.com/embed/DnFrOctuGPg"
    },
    {
      id: "lesson-4",
      classId: "class-3",
      title: "Quantum Physics & Space-Time Mechanics",
      content: `## Immersive Quantum Physics & Space-Time lecture!\nWelcome, Scholars. Today we delve into the marvelous world of quantum field theory and relativity.\n\n### Key Conceptual Pillars:\n- **Quantum Superposition**: Particles exist in all possible states until observed.\n- **Space-Time Curvature**: Gravitational forces are described as geometric distortions of the fourth-dimensional continuum.\n- **Quantum Entanglement**: Action at a distance, connecting particle spins across galaxies.\n\nTake a look at the attached Kurzgesagt documentary video and the immersive Google Slides lecture notes below.`,
      publishedAt: "2026-07-14T08:00:00Z",
      videoUrl: "https://www.youtube.com/embed/3M8iW0n_r68",
      pptUrl: "https://docs.google.com/presentation/d/e/2PACX-1vS_g7z9W4kLqS_iS9-j95UvREB4V8gI3n6yDOnXq-B7sRkE3lT31u_b4S/embed?start=false&loop=false&delayms=3000",
      webUrl: "https://eyes.nasa.gov",
      webUrlTitle: "NASA Interactive Eyes on Space"
    },
    {
      id: "lesson-5",
      classId: "class-4",
      title: "Historical Architecture of Ancient Rome",
      content: `## The Marvels of Roman Architecture\nWelcome to Class 3A History! This lesson covers the incredible structural and artistic feats of the Roman Empire:\n\n### Core Engineering Feats:\n- **The Arch**: Distributes weight more evenly, allowing larger bridges and roofs.\n- **Concrete (Opus Caementicium)**: A formula using volcanic ash, allowing underwater construction and long-lasting monuments.\n- **The Aqueducts**: Gravity-fed water supplies leading straight into Rome's center.\n\nExplore the virtual 3D reconstruction video of Ancient Rome and review the PowerPoint deck.`,
      publishedAt: "2026-07-14T09:15:00Z",
      videoUrl: "https://www.youtube.com/embed/b3R7-V-g3C0",
      pptUrl: "https://docs.google.com/presentation/d/e/2PACX-1vS_g7z9W4kLqS_iS9-j95UvREB4V8gI3n6yDOnXq-B7sRkE3lT31u_b4S/embed?start=false&loop=false&delayms=5000",
      webUrl: "https://www.worldhistory.org/Rome/",
      webUrlTitle: "World History Encyclopedia: Ancient Rome"
    }
  ],
  tasks: [
    {
      id: "task-1",
      classId: "class-1",
      title: "German Vocabulary Matcher",
      description: "Match the German greeting or phrase with its correct English meaning. Drag each German text block into its appropriate English definition container below.",
      rewardXp: 150,
      dueDate: "2026-07-20",
      type: "dragdrop",
      dragItems: ["Guten Tag", "Danke", "Auf Wiedersehen"],
      dropZones: ["Good day / Hello", "Thank you", "Goodbye"],
      correctPairing: {
        "Guten Tag": "Good day / Hello",
        "Danke": "Thank you",
        "Auf Wiedersehen": "Goodbye"
      }
    },
    {
      id: "task-2",
      classId: "class-1",
      title: "Introduce Yourself in German",
      description: "Write a short paragraph in German introducing yourself. Say hello, state your name, and write a polite closing phrase using what you have learned.",
      rewardXp: 200,
      dueDate: "2026-07-22",
      type: "text"
    },
    {
      id: "task-3",
      classId: "class-2",
      title: "The Fraction Pizza Challenge",
      description: "Write a short explanation to solve this: If Alex has 5/8 of a cake and gives 2/8 of the cake to Marcus, what fraction of the cake does Alex have left? Show your formula and explain your steps.",
      rewardXp: 250,
      dueDate: "2026-07-19",
      type: "text"
    }
  ],
  announcements: [
    {
      id: "ann-1",
      classId: "class-1",
      title: "Welcome to Class 2B German!",
      content: "Hi everyone! Professor Hamza here. I am thrilled to guide you through conversational German and grammar this semester. Check out the Lessons tab to start, and use our Insyte AI Tutor to practice writing German sentences!",
      authorName: "Prof. Hamza",
      publishedAt: "2026-07-10T09:00:00Z"
    },
    {
      id: "ann-2",
      classId: "class-2",
      title: "Fractions Practice Active",
      content: "Hello mathematicians! We have unlocked our first Math task on fractions. Complete the task before the deadline to earn 250 XP and climb our leaderboard!",
      authorName: "Prof. Hamza",
      publishedAt: "2026-07-11T14:15:00Z"
    }
  ],
  chatMessages: [
    {
      id: "msg-1",
      classId: "class-1",
      senderId: "teacher-1",
      senderName: "Prof. Hamza",
      senderRole: "teacher",
      senderAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hamza",
      text: "Guten Tag everyone! Welcome to the Class 2B German chat room. Ask questions or converse in German here!",
      timestamp: "2026-07-10T09:05:00Z"
    },
    {
      id: "msg-2",
      classId: "class-1",
      senderId: "student-1",
      senderName: "Alex Rivera",
      senderRole: "student",
      senderAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      text: "Hallo Prof! Super excited to learn German this semester.",
      timestamp: "2026-07-10T11:20:00Z"
    },
    {
      id: "msg-3",
      classId: "class-1",
      senderId: "student-2",
      senderName: "Chloe Chen",
      senderRole: "student",
      senderAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe",
      text: "Has anyone completed the German Vocabulary Matcher? It's so cool!",
      timestamp: "2026-07-12T15:45:00Z"
    },
    {
      id: "msg-4",
      classId: "class-1",
      senderId: "student-3",
      senderName: "Marcus Vance",
      senderRole: "student",
      senderAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus",
      text: "Yes Chloe! It makes matching 'Auf Wiedersehen' to goodbye very intuitive.",
      timestamp: "2026-07-12T16:10:00Z"
    }
  ],
  events: [
    {
      id: "evt-1",
      classId: "class-1",
      title: "German Conversation Live Practice",
      description: "Join Professor Hamza on a live review of basic Greetings, German pronunciation, and pronoun grammar rules.",
      date: "2026-07-18",
      time: "15:00"
    },
    {
      id: "evt-2",
      classId: "class-1",
      title: "German Matcher Assignment Due",
      description: "Make sure to finish your drag-and-drop matching assignment by tonight for XP rewards.",
      date: "2026-07-20",
      time: "23:59"
    },
    {
      id: "evt-3",
      classId: "class-2",
      title: "Math Fractions Workshop",
      description: "Bring your questions about numerators, denominators, and chocolate block divisions to class.",
      date: "2026-07-19",
      time: "10:00"
    }
  ],
  submissions: []
};

// Help helper to get database state
function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), "utf8");
      return seedData;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file. Reverting to initial seeds.", error);
    return seedData;
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

// Allow requests from the Vercel frontend
app.use((req, res, next) => {
  // CORS
  res.header("Access-Control-Allow-Origin", "https://insyte-1-4.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

  // Security headers
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://insyte-1-4.vercel.app"
  );

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

  // Create a brand new student profile
  app.post("/api/students", (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and Email are required." });
    }

    const db = readDb();
    const newStudent: UserProfile = {
      id: `student-${Date.now()}`,
      name,
      email,
      role: "student",
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      xp: 0,
      level: 1,
      rank: "Freshman Scholar",
      joinedClasses: db.classes.map(cl => cl.id) // Join all current classes by default
    };

    db.students.push(newStudent);
    
    // Also add this student to all classroom lists
    db.classes = db.classes.map(cl => ({
      ...cl,
      studentIds: Array.from(new Set([...cl.studentIds, newStudent.id]))
    }));

    writeDb(db);
    res.status(201).json({ student: newStudent, allStudents: db.students, allClasses: db.classes });
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

    const db = readDb();
    const newClass: ClassCommunity = {
      id: `class-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      description: description || "",
      teacherId: teacherId || db.teacher.id,
      teacherName: teacherName || db.teacher.name,
      studentIds: db.students.map(s => s.id), // Automatically enroll all active student profiles
      color: color || "indigo"
    };

    db.classes.push(newClass);

    // Update students joined classes array
    db.students = db.students.map(stud => ({
      ...stud,
      joinedClasses: Array.from(new Set([...stud.joinedClasses, newClass.id]))
    }));

    writeDb(db);
    res.status(201).json({ class: newClass, allClasses: db.classes, allStudents: db.students });
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
    writeDb(db);
    res.status(201).json(newTask);
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
      authorName: authorName || db.teacher.name,
      publishedAt: new Date().toISOString()
    };

    db.announcements.unshift(newAnn);
    writeDb(db);
    res.status(201).json(newAnn);
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

    writeDb(db);
    res.json({ 
      submission: updatedSubmission, 
      allSubmissions: db.submissions, 
      allStudents: db.students 
    });
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
    const vite = await createViteServer({
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
