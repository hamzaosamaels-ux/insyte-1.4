-- ============================================================================
-- insyte — Supabase schema + Row Level Security
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================================

-- One row per profile. Mirrors the UserProfile TypeScript interface.
create table if not exists public.profiles (
  id             text primary key,
  name           text not null,
  email          text not null unique,
  role           text not null check (role in ('student','teacher')),
  avatar         text not null default '',
  xp             integer not null default 0,
  level          integer not null default 1,
  rank           text not null default 'Freshman Scholar',
  joined_classes jsonb not null default '[]',
  streak         integer not null default 0,
  last_active_date text not null default '',
  read_lessons   jsonb not null default '[]',
  -- Auth: only the server (service role) ever reads this. scrypt "salt:hash".
  password_hash  text,
  -- Real-email verification: unverified accounts can't log in until the
  -- link in their inbox is clicked. Token/expiry never reach the client.
  email_verified boolean not null default true,
  verification_token text,
  verification_token_expires_at timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx  on public.profiles (role);
-- Adds read_lessons to a profiles table created before this column existed;
-- no-op if the table was just created above with it already.
alter table public.profiles add column if not exists read_lessons jsonb not null default '[]';
-- Same idea for email verification — existing accounts are grandfathered as
-- verified (default true) since they predate this feature and can't be
-- retroactively re-verified; the server always sets an explicit value on
-- every new signup going forward, so this default only ever backfills old rows.
alter table public.profiles add column if not exists email_verified boolean not null default true;
alter table public.profiles add column if not exists verification_token text;
alter table public.profiles add column if not exists verification_token_expires_at timestamptz;

create table if not exists public.classes (
  id           text primary key,
  name         text not null,
  code         text not null unique,
  description  text not null default '',
  teacher_id   text not null,
  teacher_name text not null,
  student_ids  jsonb not null default '[]',
  color        text not null default 'indigo',
  created_at   timestamptz not null default now()
);
create index if not exists classes_code_idx on public.classes (lower(code));

create table if not exists public.lessons (
  id            text primary key,
  class_id      text not null,
  title         text not null,
  content       text not null,
  published_at  text not null,
  video_url     text default '',
  ppt_url       text default '',
  web_url       text default '',
  web_url_title text default ''
);
create index if not exists lessons_class_idx on public.lessons (class_id);

create table if not exists public.tasks (
  id              text primary key,
  class_id        text not null,
  title           text not null,
  description     text not null,
  reward_xp       integer not null default 0,
  due_date        text not null,
  type            text not null check (type in ('text','dragdrop')),
  drag_items      jsonb,
  drop_zones      jsonb,
  correct_pairing jsonb
);
create index if not exists tasks_class_idx on public.tasks (class_id);

create table if not exists public.submissions (
  id             text primary key,
  task_id        text not null,
  task_title     text not null,
  student_id     text not null,
  student_name   text not null,
  student_avatar text not null default '',
  content        text not null default '',
  submitted_at   text not null,
  is_graded      boolean not null default false,
  score_xp_earned integer not null default 0,
  feedback       text
);
create index if not exists submissions_student_idx on public.submissions (student_id);
create index if not exists submissions_task_idx    on public.submissions (task_id);

create table if not exists public.announcements (
  id           text primary key,
  class_id     text not null,
  title        text not null,
  content      text not null,
  author_name  text not null,
  published_at text not null
);
create index if not exists announcements_class_idx on public.announcements (class_id);

create table if not exists public.chat_messages (
  id            text primary key,
  class_id      text not null,
  sender_id     text not null,
  sender_name   text not null,
  sender_role   text not null,
  sender_avatar text not null default '',
  text          text not null,
  timestamp     text not null
);
create index if not exists chat_class_idx on public.chat_messages (class_id);

create table if not exists public.events (
  id          text primary key,
  class_id    text not null,
  title       text not null,
  description text not null default '',
  date        text not null,
  time        text not null
);
create index if not exists events_class_idx on public.events (class_id);

create table if not exists public.mails (
  id          text primary key,
  from_id     text not null,
  from_name   text not null,
  from_avatar text not null default '',
  to_id       text not null,
  to_name     text not null,
  subject     text not null,
  body        text not null,
  sent_at     text not null,
  read        boolean not null default false
);
create index if not exists mails_to_idx   on public.mails (to_id);
create index if not exists mails_from_idx on public.mails (from_id);

create table if not exists public.notifications (
  id         text primary key,
  user_id    text not null,
  type       text not null,
  title      text not null,
  body       text not null,
  created_at text not null,
  read       boolean not null default false
);
create index if not exists notifications_user_idx on public.notifications (user_id);

create table if not exists public.sessions (
  token      text primary key,
  user_id    text not null,
  created_at timestamptz not null default now(),
  -- The app always sets this explicitly at mint time and re-sends the SAME
  -- value on every later save (never recomputed), so a session's expiry
  -- can't drift just because an unrelated write touched the table.
  issued_at  timestamptz not null default now()
);
-- Adds issued_at to a sessions table created before this column existed.
-- Existing live sessions get a fresh 30-day window from migration time
-- rather than an unknown true age — a safe default, not a forced logout.
alter table public.sessions add column if not exists issued_at timestamptz not null default now();

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- The Express server connects with the SERVICE ROLE key, which bypasses RLS —
-- that is how the backend reads and writes freely. RLS below is defense in
-- depth: if the anon/public key or the project URL ever leaks, these policies
-- decide what an untrusted client can touch. We enable RLS on every table and
-- grant the anon role NOTHING (no policies = deny all). Nobody reaches your
-- data except through the server you control.
--
-- If you later move any reads to the browser with the anon key + Supabase Auth,
-- replace the deny-all posture with per-user policies (examples at the bottom).
-- ============================================================================

alter table public.profiles      enable row level security;
alter table public.classes       enable row level security;
alter table public.lessons       enable row level security;
alter table public.tasks         enable row level security;
alter table public.submissions   enable row level security;
alter table public.announcements enable row level security;
alter table public.chat_messages enable row level security;
alter table public.events        enable row level security;
alter table public.mails         enable row level security;
alter table public.notifications enable row level security;
alter table public.sessions      enable row level security;

-- No policies are defined, so with RLS enabled the anon and authenticated
-- roles are denied all access by default. The service role bypasses RLS and is
-- unaffected. This is the safe default for a server-gatekept app.

-- ----------------------------------------------------------------------------
-- OPTIONAL — direct-from-browser policies (only if you adopt Supabase Auth and
-- give the browser the anon key). Uncomment and adapt; requires profiles.id to
-- equal auth.uid(). Left commented so they don't loosen the deny-all default.
-- ----------------------------------------------------------------------------
-- create policy "read own profile"
--   on public.profiles for select
--   using ( id = auth.uid()::text );
--
-- create policy "read own mail"
--   on public.mails for select
--   using ( to_id = auth.uid()::text or from_id = auth.uid()::text );
--
-- create policy "read own notifications"
--   on public.notifications for select
--   using ( user_id = auth.uid()::text );
