---
name: insyte-status
description: Full health and status report for insyte — what's running, what's down, what's at risk, what to fix next. Use when asked "how is the project", "is everything ok", "status report", "what's broken", "generate a report", or before/after a deploy. Also the right skill when someone wants something shareable to send to a teammate.
---

# insyte status report

Produce a report a non-expert can act on. Run the checks, then write findings —
never report a check you didn't actually run.

## 1. Live services

```bash
curl -s https://insyte-14-production.up.railway.app/api/health
curl -s -o /dev/null -w "vercel: %{http_code}\n" https://insyte-1-4.vercel.app
```

Read `/api/health` carefully — every field means something:

| Field | Healthy | If wrong |
|---|---|---|
| `storage` | `supabase (persistent)` | `file (wiped on redeploy!)` = env vars missing on Railway; data dies every deploy |
| `supabaseReady` | `true` | `false` = can't reach the database; all `/api/*` return 503 by design |
| `persisting` | `true` | **`false` is urgent** — writes are silently failing, new data exists only in memory and dies on restart |
| `schemaProblems` | absent | present = code writes columns the live DB lacks; run the ALTERs in `website/supabase/schema.sql` |
| `emailEnabled` | `true` | `false` = signups return 503 (`BREVO_API_KEY` missing) |

## 2. Deploys

```bash
curl -s "https://api.github.com/repos/hamzaosamaels-ux/insyte-1.4/commits/main/status" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('overall:',j.state);(j.statuses||[]).forEach(s=>console.log(s.context,'|',s.state,'|',s.description))})"
```

Both Vercel and Railway must be `success`. A stale `failure` can linger from an
earlier attempt — confirm against the live URLs above before reporting it as down.

## 3. Does it compile and build

```bash
cd website && npx tsc --noEmit && npm run build
cd app && npx tsc --noEmit
```

Green here does NOT mean it renders correctly — see the "green build ≠ working"
note in the repo's CLAUDE.md. For visual work, render and inspect computed style.

## 4. Data sanity

```bash
curl -s https://insyte-14-production.up.railway.app/api/data \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('students',j.students.length,'teachers',j.teachers.length,'classes',j.classes.length,'lessons',j.lessons.length,'tasks',j.tasks.length)})"
```

Compare against Supabase's own row counts. **A mismatch means data is living in
memory only and will be lost on the next restart** — this exact situation has
happened, so treat any gap as urgent rather than a rounding error.

## 5. Leak check

Confirm the public endpoint isn't handing out secrets:

```bash
curl -s https://insyte-14-production.up.railway.app/api/data \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);const leaked=j.classes.filter(c=>c.code);console.log('classes exposing a join code to an anonymous caller:',leaked.length)})"
```

Should be `0` unauthenticated. Anything above zero means anyone can enroll in
those classes. Also confirm no response contains `passwordHash`,
`verificationToken`, or `resetToken`.

## 6. Report format

Lead with the single most important thing. Group as:

- **Working** — one line each, no detail needed
- **Broken / at risk** — what, the user-visible effect, and the exact fix
- **Worth doing next** — ranked, with why

Say plainly when something wasn't checked. If a check couldn't run, that's a
finding, not something to omit.

For a shareable version, write it to `STATUS.md` in the repo root as plain
Markdown with no jargon — assume the reader knows the product, not the code.
