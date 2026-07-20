# Handoff prompts

## 1. Single grade-parsing source

```
/make-plan Share one community-name parser between client and server in
C:\projects\insyte-1.5. Today the " - " split exists twice: gradeOf
(server.ts:427, used by siblingClassIds server.ts:432 and /api/classes
server.ts:827) and getGradeAndSubject (src/components/TeacherDashboard.tsx:89).
Create src/utils/community.ts exporting gradeOf(name) and
gradeAndSubject(name); import it from server.ts and TeacherDashboard.tsx;
delete both local copies. No new abstraction beyond the two functions, no
config, no class. Flowchart: PATHFINDER-2026-07-20/01-flowcharts/community-membership.md
```

## 2. DrawerTopBar component (optional, do with next drawer change)

```
/make-plan Extract the mobile drawer top-bar (NotificationBell inDrawer +
NavbarControls, teacher variant also create/add-subject buttons) into one
DrawerTopBar component in C:\projects\insyte-1.5. Call sites:
src/components/StudentDashboard.tsx:593-602, StudentDashboard.tsx:1770-1779,
TeacherDashboard.tsx:601-622. Props stay primitive (notifications, handlers,
language/theme setters, optional teacher actions slot). No context provider,
no compound-component pattern. Flowchart: PATHFINDER-2026-07-20/01-flowcharts/notifications.md
```
