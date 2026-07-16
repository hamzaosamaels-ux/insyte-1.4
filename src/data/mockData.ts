import { UserProfile, ClassCommunity, Lesson, TaskItem, Announcement, ChatMessage, ClassEvent } from "../types";

export const initialStudents: UserProfile[] = [
  {
    id: "student-1",
    name: "Alex Rivera",
    email: "alex@insyte.edu",
    role: "student",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
    xp: 2450,
    level: 3,
    rank: "Advanced Scholar",
    joinedClasses: ["class-1", "class-2"]
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
    joinedClasses: ["class-1"]
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
    joinedClasses: ["class-1", "class-2"]
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
    joinedClasses: ["class-2"]
  }
];

export const initialTeacher: UserProfile = {
  id: "teacher-1",
  name: "Prof. Hamza",
  email: "hamza@insyte.edu",
  role: "teacher",
  avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hamza",
  xp: 0,
  level: 10,
  rank: "Master Educator",
  joinedClasses: ["class-1", "class-2"]
};

export const initialClasses: ClassCommunity[] = [
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
  }
];

export const initialLessons: Lesson[] = [
  {
    id: "lesson-1",
    classId: "class-1",
    title: "1. Basic German Greetings",
    content: `## Guten Tag! Welcome to Class 2B German!
In this lesson, we will explore core greetings that form the foundation of conversational German:

### 1. Guten Tag (Good day / Hello)
The most common polite greeting used throughout Germany. You can use it with anyone from teachers to shopkeepers!

### 2. Guten Morgen (Good morning)
Used typically until about 11 AM to wish someone a wonderful morning.

### 3. Danke & Bitte (Thank you & Please)
Polite conversational keywords. 'Bitte' also doubles as 'You are welcome' when someone says 'Danke'.

### 4. Auf Wiedersehen (Goodbye)
A slightly formal but very polite way to say goodbye, literally meaning 'Until we see each other again'.

### Summary Dialogue
- **A**: Guten Tag, wie geht es dir? (Hello, how are you?)
- **B**: Mir geht es gut, danke! Und dir? (I am doing well, thank you! And you?)`,
    publishedAt: "2026-07-10T09:00:00Z"
  },
  {
    id: "lesson-2",
    classId: "class-1",
    title: "2. German Nouns and Genders",
    content: `## Noun Genders in German
Unlike English, German nouns can be masculine, feminine, or neuter, and require different definite articles ('the'):

### 1. Masculine: Der
Used for masculine nouns.
- *der Mann* (the man)
- *der Hund* (the dog)

### 2. Feminine: Die
Used for feminine nouns.
- *die Frau* (the woman)
- *die Katze* (the cat)

### 3. Neuter: Das
Used for neuter nouns.
- *das Kind* (the child)
- *das Buch* (the book)

### Key Rule
Always learn a new German noun alongside its corresponding article (*der, die, or das*)!`,
    publishedAt: "2026-07-12T10:30:00Z"
  },
  {
    id: "lesson-3",
    classId: "class-2",
    title: "1. Understanding Fractions",
    content: `## Introduction to Fractions
Fractions are used to represent a portion or a part of a whole quantity.

### Anatomy of a Fraction
- **Numerator** (the top number): Indicates how many parts of the whole we are actively considering.
- **Denominator** (the bottom number): Indicates how many equal parts the whole is divided into.

### Visualization
Imagine a large delicious pizza sliced into **4 equal parts**:
- If you eat 1 slice, you have consumed **1/4** of the pizza.
- If Chloe eats 2 slices, she has consumed **2/4** (which simplifies to **1/2**) of the pizza.
- The denominator remains 4 because the pizza is always cut into 4 total slices.

### Word Problem
If a chocolate bar has 6 blocks, and you eat 3 blocks, you have eaten 3/6 (or 1/2) of the bar!`,
    publishedAt: "2026-07-11T14:00:00Z"
  }
];

export const initialTasks: TaskItem[] = [
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
];

export const initialAnnouncements: Announcement[] = [
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
];

export const initialChatMessages: ChatMessage[] = [
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
];

export const initialEvents: ClassEvent[] = [
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
];
