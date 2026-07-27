# insyte — work completed 2026-07-18

Everything below is merged to `main` (commits `5d557de`, `2b698e2`) and live on
https://insyte-1-4.vercel.app (frontend) + Railway (backend). Do not redo these.

## Accounts and auth
- Removed all premade demo accounts (Alex, Chloe, Marcus, Sophia, Prof. Hamza) and all seeded lessons, tasks, chats, and events. The database now starts empty.
- New signup flow: anyone can register as a student or a teacher (name + email). Duplicate emails are rejected.
- New login flow by email (`POST /api/login`). No passwords yet; add them before real use.
- Sessions persist in localStorage and re-sync with the backend on load.
- Multiple teachers are supported. The schema changed from a single `teacher` object to a `teachers` array; the server migrates old `db.json` shapes automatically.

## Classes and enrollment
- Fixed: new students no longer auto-join every class. They start with zero classes.
- Fixed: creating a class no longer auto-enrolls every student. Classes start empty.
- New: students join with a class code (`POST /api/classes/join`). Join Community button in the student sidebar and in the empty state. Codes are case-insensitive; bad codes get a clear error.
- New: class codes must be unique; creating a class with a taken code returns an error the UI shows.
- New: teacher lobby shows the class code as a chip; clicking copies it.
- New: teachers add a subject class from inside a community (Add Subject button in lobby). The grade field locks to the active community. The header + still creates a brand-new community.

## Mail, notifications, streaks
- New in-app mail: inbox, sent, compose, unread badges, mark-as-read. Students can mail their teachers and classmates; teachers can mail their students and other teachers.
- New notifications with a header bell: new announcements, new assignments, grades, mail, and students joining a class. Mark-all-read supported.
- New daily login streak per user, shown as a flame badge in both dashboards.

## Production bugs fixed
- Every frontend write (signup, chat, submissions, grading, class creation) was calling relative paths, which hit the Vercel domain where no backend exists. All API calls now go through one API base pointing at Railway. This was silently breaking all writes in production.
- The AI tutor chat had the same bug and always failed in production. Fixed. If it still errors, set `GEMINI_API_KEY` in Railway variables.
- Lesson video and slide embeds rendered as broken grey boxes: the Vercel CSP `frame-src` only allowed vercel.live. Now allows YouTube, youtube-nocookie, Vimeo, and Google Docs/Slides.
- `db.json` was committed to the repo with demo data and deployed everywhere. Removed and gitignored; never commit it again, it holds user data.
- CORS now allows localhost dev origins alongside the Vercel domain.
- Security headers (CSP, X-Frame-Options) are production-only; they were blanking the local dev preview.

## Known issues — next up (not done)
- Railway disk is ephemeral: `db.json` is wiped on every redeploy, so all accounts and content die with each deploy. Supabase migration is the agreed fix and the next task.
- No passwords on accounts; login is email-only.
- `GEMINI_API_KEY` on Railway needs checking for the AI tutor.
- Design refresh pending: six palette directions + ranked UX fix list are prepared; waiting on a pick.

## Still open from the fixes doc
Lesson AI (NotebookLM-style), file/drive uploads, manual XP adjust per student, performance caching, per-IP rate limiting, WAF, spend alerts.
