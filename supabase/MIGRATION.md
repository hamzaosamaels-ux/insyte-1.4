# Supabase migration — how to switch insyte off the fragile db.json file

Right now all data (accounts, classes, mail, homework) lives in one file,
`db.json`, on Railway's disk. Railway wipes that disk on every redeploy, so
everything is lost each deploy. This migration moves the data into your
Supabase project so it survives forever.

**Nothing here touches your live app until you finish step 4.** The code ships
behind a flag: if the two environment variables below are not set, the server
keeps using `db.json` exactly as before.

## What you get

- Data survives redeploys (the whole point).
- Real tables you can browse and export in the Supabase dashboard.
- Row Level Security (RLS) enabled on every table as a defense layer — see
  "How RLS protects you" below.

## Steps

### 1. Create the tables
In Supabase: **SQL Editor → New query**, paste all of
[`schema.sql`](./schema.sql), press **Run**. Re-running is safe.

### 2. Get your two keys
Supabase dashboard → **Project Settings → API**:
- **Project URL** (looks like `https://gnmcgwborxwsgoujqpod.supabase.co`)
- **service_role key** (the secret one, NOT the `anon` key)

The service_role key is a full-access secret. Only ever put it in Railway's
environment variables — never in the frontend, never committed to git.

### 3. Add them to Railway
Railway → your backend service → **Variables** → add:
```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_KEY=<your service_role key>
```
(While you are there, also add `GEMINI_API_KEY=<your Gemini key>` to fix the AI
tutor — that error is a missing key, not a bug.)

### 4. Deploy this branch
Merge `supabase-migration` into `main` (or point Railway at this branch). On
boot the server logs one of:
```
[Insyte] Persistence: Supabase (data survives redeploys)
[Insyte] Persistence: local db.json (set SUPABASE_URL to use Supabase)
```
If it says Supabase, you are done.

## How it works (plain version)

- On startup the server loads every table from Supabase into memory once.
- Reads are served from memory (fast).
- Every write updates memory immediately and saves to Supabase in the
  background, so a redeploy reloads the saved data instead of an empty file.
- This assumes **one** backend instance (Railway Hobby runs one). If you ever
  scale to multiple instances, we switch to per-row writes — tell me first.

## How RLS protects you

Your Express server talks to Supabase with the **service_role** key, which is
allowed to read/write everything — that is how the backend works. RLS is turned
on for every table with **no public policies**, which means the **anon** key
(the one a browser would use) is denied all access by default. So even if your
project URL and anon key leak, nobody can read your tables directly — the only
door is the server you control, which already checks passwords and tokens.

If you later want the browser to talk to Supabase directly (using Supabase Auth
+ the anon key), open `schema.sql` and uncomment the example per-user policies
at the bottom, then adapt them. Until then, deny-all is the safe posture.

## Rolling back

Remove the two Railway variables and redeploy. The server falls back to
`db.json`. No code change needed.
