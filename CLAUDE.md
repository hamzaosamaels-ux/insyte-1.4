# insyte — working agreement

Loaded automatically at the start of every session in this repo. It exists so a
fresh session doesn't have to rediscover the same things, and so token-saving
behaviour is on by default instead of being requested each time.

## Always on, no need to ask

At the start of a session, invoke these without waiting to be told:

- **`caveman`** — terse output. Drop articles and filler, keep every piece of
  technical substance, code, and exact error strings. Roughly 65% fewer output
  tokens for the same information.
- **`ponytail`** — laziest solution that actually works. Reuse before writing,
  stdlib before dependencies, one line before fifty. Question whether a piece of
  work needs to exist at all.

Pick other skills by what the task actually is, without being asked by name:

| Situation | Skill |
|---|---|
| Reviewing a diff or PR | `caveman-review` |
| Writing a commit message | `caveman-commit` |
| "is this over-engineered", "what can we delete" | `ponytail-review` |
| Any UI/layout/styling/animation work | `ui-ux-pro-max` |
| A bug, test failure, or anything unexplained | `systematic-debugging` |
| Multi-step feature before touching code | `brainstorming`, then `writing-plans` |
| Before claiming something works | `verification-before-completion` |
| Searching past sessions | `claude-mem:mem-search` |

## Services, and what a session can actually reach

| Service | What it is | Reachable from a session? |
|---|---|---|
| GitHub `hamzaosamaels-ux/insyte-1.4` | Source. **Public** — never commit secrets or a list of known weaknesses | Yes — git, and the API unauthenticated |
| Railway | Runs the backend (`website/server.ts`). Holds every secret | **No dashboard access.** Behaviour is observable only via `/api/health` |
| Vercel | Serves the frontend. Root Directory = `website` | **No dashboard access.** Observable via the live URL + commit status |
| Supabase | The database. Service key lives only in Railway | **No credentials.** SQL must be run by the user in their SQL editor |
| Brevo | Sends signup/verification email | **No access.** Observable via `emailEnabled` on `/api/health` |

Practical consequence: anything requiring a dashboard login, an API key, or a
SQL editor is the user's to do. Say so plainly rather than pretending or
guessing — and give the exact steps or SQL rather than a vague instruction.

Live checks that work with no credentials:

```bash
curl -s https://insyte-14-production.up.railway.app/api/health
curl -s "https://api.github.com/repos/hamzaosamaels-ux/insyte-1.4/commits/main/status"
```

The `insyte-status` skill (`.claude/skills/`) runs the full set.

## History — the incidents worth knowing

Roughly chronological. Each one cost real time or real data; the fixes are in
place, but the patterns repeat if nobody remembers them.

- **Railway deploys failed for a day.** Not the code — Railway was building the
  whole frontend. Fixed by building server-only with a lazy vite import.
- **Everyone logged out on every deploy.** A slow Supabase load at boot made the
  server serve an empty database, so `/api/me` answered 401 and clients
  helpfully deleted their own sessions. Now returns 503 while not ready.
- **Four accounts existed only in memory.** Columns the code wrote didn't exist
  in the live database, every profile write threw inside a background `.catch`,
  and nothing surfaced it. Led to `persisting` on `/api/health`.
- **Every quiz task silently failed to save.** The `tasks_type_check` constraint
  never learned about `'quiz'`, and `quiz_questions` had no column or mapping.
  Caught within a day by the new `persisting` flag.
- **Quizzes scored every honest student zero.** `publicTask` strips
  `correctIndex`, but the client graded against it — so real answers were always
  wrong and a blank submission scored full marks. Grading moved server-side.
- **Anyone could read every class join code**, unauthenticated, from `/api/data`.
- **Fonts silently fell back to serif**, and NativeWind dropped `className` on
  `Animated.Text` — both with a green build. Hence the rule below about
  rendering rather than trusting compilation.

The through-line: the expensive bugs here are the *silent* ones. When adding
anything that writes data or renders visually, ask how it would fail loudly.

## Repo layout

Two deployed projects plus one shared package. They install independently —
deliberately NOT npm workspaces, so a native-only dependency can never end up in
the deployed website build.

```
website/   Vite + React frontend AND the Express backend (server.ts)
           -> Vercel (frontend) + Railway (backend). Root Directory = "website"
app/       Expo / React Native app (SDK 57)
packages/  shared/ — types, translations, api, auth, storage. Used by both.
bot/       Read-only Telegram status bot. No DB access, no write path.
           Separate Railway service, Root Directory = "bot".
```

Root `package.json` is convenience scripts only: `npm run website`,
`npm run app`, `npm run app:web`, `npm run typecheck`.

## Hard-won lessons — read before changing these areas

**Schema drift is the recurring bug in this project.** Three separate times a
field was added in code, `supabase/schema.sql` was updated, but the statements
were never run against the live database. Writes then fail inside a background
`.catch`, so the app looks perfectly healthy while new data lives only in memory
and dies on the next restart.
→ After ANY change to `supabase-store.ts` mappings or `schema.sql`, the ALTER
statements MUST be run in the Supabase SQL editor. `verifySchema()` now checks
this at boot and reports `schemaProblems` on `/api/health`.

**`/api/health` is the diagnostic.** `persisting: false` means writes are
silently failing — treat as urgent. Also reports `supabaseReady`, `emailEnabled`,
`schemaProblems`, and the last save error.

**Never hand-edit rows in the Supabase Table Editor while the app is running.**
The backend holds everything in memory and writes it back, so manual edits get
reverted. Restart Railway after any manual database change.

**Green build ≠ working.** Two real bugs shipped with `tsc` clean and a
successful bundle: fonts silently falling back to system serif (Tailwind names
didn't match what `expo-font` registers), and NativeWind's `className` being
dropped entirely on `Animated.Text`. For anything visual, render it and inspect
`getComputedStyle` — don't trust compilation.

**Grade on the server, never the client.** `publicTask` strips `correctIndex`
before tasks reach students, so client-side quiz grading scored every honest
answer wrong and a blank submission perfect. Auto-graded types are scored in
`POST /api/submissions`.

**Expo Go can't run SDK 57** — "version unavailable" is expected, not a broken
phone. Use `npm run app:web`, or an EAS build (`app/eas.json` has an APK
profile).

## Conventions

- Small, single-purpose commits; verify before each one.
- `npx tsc --noEmit` in the changed project, plus `npm run build` for website.
- `npm test` in `website/` — runs on every push via CI. No framework: plain
  `tsx` files using `node:assert`. Add new ones the same way and list them in
  the `test` script.
  - `supabase-schema.test.ts` asserts every column the code writes is defined
    in `schema.sql`. This is the guard against the drift that has cost data
    three times — if it fails, do not "fix" it by editing the test.
- Tests and a green build are necessary but not sufficient. Both have passed
  while a real bug shipped. Verification means running the thing: a local
  server plus a real request, or a rendered page whose computed style you
  actually inspected.
- Deploy statuses are readable without the dashboards via the GitHub commit
  status API (the repo is public).
- Avoid two agent sessions editing this repo at once. It has caused real
  conflicts, and it is how a data-loss bug went unnoticed for a day.
