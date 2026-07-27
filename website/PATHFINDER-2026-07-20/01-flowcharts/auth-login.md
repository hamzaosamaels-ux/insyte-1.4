# Auth / login flow

```mermaid
flowchart TD
    W["WelcomeScreen (login default)<br/>WelcomeScreen.tsx:14"] --> F{mode}
    F -->|signup| SU["POST /api/signup<br/>server.ts:547<br/>scrypt hash, role student|teacher"]
    F -->|login| LI["POST /api/login<br/>server.ts:595"]
    SU --> TOK["session token issued<br/>stored localStorage insyte_token<br/>src/api.ts:11"]
    LI --> TOK
    TOK --> ME["GET /api/me (X-Auth-Token)<br/>server.ts:532"]
    ME --> APP["currentUser state → dashboard by role<br/>src/App.tsx"]
    APP --> KEEP["30s /api/me refresh<br/>src/App.tsx:175"]
```

Login = 3 fields total (email, password, submit), single screen, no redirect
chain — audit's "too many steps" finding already minimal; no change made.
Today: labels linked (htmlFor/id), contrast raised, single consistent CTA.
