# Notifications flow

```mermaid
flowchart TD
    E[Server event: join/task/grade/mail/announcement/event] --> N["notify()<br/>server.ts:303"]
    N --> DB[(db.notifications<br/>flat-file or Supabase)]
    P["4s poll tick<br/>src/App.tsx:168"] --> GET["GET /api/data<br/>server.ts:514"]
    GET --> DB
    GET --> STATE["myNotifications state<br/>src/App.tsx"]
    STATE --> BELL_D["NotificationBell (desktop header)<br/>StudentDashboard.tsx:551 / TeacherDashboard.tsx:563"]
    STATE --> BELL_M["NotificationBell (mobile drawer, inDrawer)<br/>StudentDashboard.tsx:594,1771 / TeacherDashboard.tsx:613"]
    BELL_D --> PANEL["Dropdown panel<br/>HeaderExtras.tsx:74<br/>end-0 w-80 (desktop) / start-0 w-13rem (drawer)"]
    BELL_M --> PANEL
    PANEL --> MARK["POST /api/notifications/read<br/>server.ts:1227"]
    MARK --> DB
```

Side effects: db write on notify + mark-read. Browser Notification API (Settings
opt-in) mirrors new items client-side.

Fixed today: drawer instance rendered `end-0` (opens leftward) inside the
left-anchored, overflow-clipped `.mobile-drawer` (index.css:52) — panel was
invisible. Now `inDrawer` prop → `start-0 w-[13rem]`, logical properties keep
RTL correct (drawer flips to right edge under `[dir="rtl"]`, index.css:65).
