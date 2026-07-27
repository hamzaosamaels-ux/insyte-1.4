# Duplication report (scoped)

1. **Grade/community name parsing — client AND server**
   - `server.ts:427` `gradeOf("Class 2B - German") → "Class 2B"`
   - `TeacherDashboard.tsx:89` `getGradeAndSubject` — same " - " split, reimplemented
   - Accidental divergence risk: a rename of the separator breaks community
     grouping silently on one side. Real consolidation target (see 04).

2. **Drawer top-bar block (bell + NavbarControls) ×3**
   - `StudentDashboard.tsx:593-602`, `StudentDashboard.tsx:1770-1779` (not-enrolled view), `TeacherDashboard.tsx:601-622`
   - Same markup; teacher variant adds create/add-subject shortcuts. Today's
     `inDrawer` prop had to be added in three places — that is the smell.
     Legitimate candidate for one `DrawerTopBar` component; low urgency.

3. **Teacher class-ownership filter ×4 → consolidated today**
   - Was: `App.tsx:585`, `TeacherDashboard.tsx:104`, `:229`, `:1650` each doing
     `c.teacherId === me.id`. Now `App.tsx:585` is the single source (owned OR
     joined); TeacherDashboard consumes the pre-scoped prop. Done.

4. **StudentDashboard vs TeacherDashboard (~1800 lines each)**
   - Shared: drawer scaffold, header, mail wiring, settings, calendar.
   - Verdict: legitimate specialization for now — different data and actions
     dominate. Do NOT force-unify; extract only the drawer top-bar (item 2).
