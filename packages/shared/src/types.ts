export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  id: string;
  name: string;
  // Present only on the signed-in user's own profile; public lists omit it
  email?: string;
  role: UserRole;
  avatar: string;
  xp: number;
  level: number;
  rank: string;
  joinedClasses: string[]; // List of classIds
  streak: number; // Consecutive-day login streak
  lastActiveDate: string; // YYYY-MM-DD
  readLessons: string[]; // Lesson ids already marked read (each awards XP once)
}

export interface Mail {
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

export type NotificationType = 'announcement' | 'task' | 'grade' | 'mail' | 'join' | 'event';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ClassCommunity {
  id: string;
  name: string;
  code: string; // Used to join class
  description: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  color?: string; // Tailwind class color base, e.g. 'emerald', 'violet', 'amber'
}

export interface Lesson {
  id: string;
  classId: string;
  title: string;
  content: string; // Markdown supported
  publishedAt: string;
  videoUrl?: string;       // Embeddable YouTube or direct video link
  pptUrl?: string;         // Presentation link (Google Slides embed, Office Live embed, or general)
  webUrl?: string;         // General external web link
  webUrlTitle?: string;    // Label for the web link
}

export type TaskType = 'text' | 'dragdrop' | 'quiz';

export interface QuizQuestion {
  question: string;
  options: string[];      // 2–4 answer choices
  correctIndex: number;   // index of the right option
}

export interface TaskItem {
  id: string;
  classId: string;
  title: string;
  description: string;
  rewardXp: number;
  dueDate: string;
  type: TaskType;
  // Drag and drop specific
  dragItems?: string[]; // E.g., ['2', '+', '2'] or ['HTML', 'CSS', 'JS']
  dropZones?: string[]; // E.g., ['Input', 'Style', 'Action'] or empty boxes
  correctPairing?: Record<string, string>; // Maps drag item to target drop zone
  // Multiple-choice quiz specific
  quizQuestions?: QuizQuestion[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  // Present only for the owner and the class teacher; public lists omit it
  content?: string; // Text answer or drag pairings JSON
  isGraded: boolean;
  scoreXpEarned?: number;
  submittedAt: string;
  feedback?: string;
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  authorName: string;
  publishedAt: string;
}

export interface ChatMessage {
  id: string;
  classId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface ClassEvent {
  id: string;
  classId: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}
