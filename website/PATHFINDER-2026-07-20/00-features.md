# Pathfinder — Feature Inventory (scoped run, 2026-07-20)

Scoped to the four systems touched by today's fixes. Full-repo fan-out skipped
deliberately (user priority = fixes; ponytail active).

| Feature | Entry points | Core files | Purpose |
|---|---|---|---|
| Auth / login | `src/components/WelcomeScreen.tsx:14`; `server.ts:547` (signup), `server.ts:595` (login), `server.ts:532` (/api/me) | WelcomeScreen.tsx, App.tsx, server.ts | scrypt password auth, session via X-Auth-Token |
| Notifications | `src/components/HeaderExtras.tsx:33` (NotificationBell); `server.ts:303` (notify), `server.ts:1227` (mark read) | HeaderExtras.tsx, App.tsx, server.ts | In-app notification feed; 4s poll (`src/App.tsx:168`); browser Notification API opt-in in Settings |
| Community membership | `server.ts:683` (/api/classes/join), `server.ts:804` (/api/classes create), `src/App.tsx:236` (handleJoinClass) | server.ts, App.tsx, TeacherDashboard.tsx, StudentDashboard.tsx | Communities = classes grouped by grade prefix (`server.ts:427` gradeOf, `:432` siblingClassIds). Join by code enrolls in all sibling subjects. Teachers can now join as co-teachers (this session) |
| Build & deploy | `package.json` build script; `.github/workflows/ci.yml`; `vercel.json` | vite.config.ts, server.ts, supabase-store.ts | `vite build` (frontend) + esbuild bundle (server.cjs). Vercel serves frontend, Railway runs backend; both deploy on push to main. Supabase storage behind env flag |

Out of scope this run: lessons, tasks/quizzes, grading, mail, chat, calendar,
gamification (XP/streaks), AI tutor, i18n, legal pages.
