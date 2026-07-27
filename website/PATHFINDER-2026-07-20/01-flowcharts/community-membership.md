# Community membership flow

```mermaid
flowchart TD
    SU["Signup (role=teacher|student)<br/>server.ts:547"] --> T0{role?}
    T0 -->|teacher, none joined| EMPTY["Empty state: Create OR Join<br/>TeacherDashboard.tsx ~1690"]
    T0 -->|student| SJOIN["Join dialog<br/>StudentDashboard.tsx:1854"]
    EMPTY --> CREATE["POST /api/classes<br/>server.ts:804"]
    EMPTY --> JOINBTN["Join Community (dialog joinMode)<br/>TeacherDashboard.tsx"]
    SJOIN --> HJ["handleJoinClass<br/>src/App.tsx:236"]
    JOINBTN --> HJ
    HJ --> JOIN["POST /api/classes/join<br/>server.ts:683"]
    JOIN --> SIB["siblingClassIds (grade grouping)<br/>server.ts:432"]
    SIB --> UPD["user.joinedClasses += communityIds<br/>students also class.studentIds"]
    UPD --> NOTIFY["notify owner<br/>server.ts:303"]
    CREATE --> OWN["teacherId = creator; teacher.joinedClasses += id"]
    UPD --> VIS["Teacher visibility filter<br/>src/App.tsx:585 (owned OR joined)"]
    OWN --> VIS
```

Invariants: `teacherId` = single owner, never changes on join (co-teacher =
membership via joinedClasses only). Student join adds to `studentIds`; teacher
join does not. Duplicate join → 409. Legacy `studentId` body key still accepted.
