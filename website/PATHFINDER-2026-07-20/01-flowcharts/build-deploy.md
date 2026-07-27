# Build & deploy flow

```mermaid
flowchart TD
    PUSH["git push main<br/>github.com/hamzaosamaels-ux/insyte-1.4"] --> CI["GitHub Actions CI<br/>.github/workflows/ci.yml<br/>node 20: npm ci, tsc, npm run build"]
    PUSH --> VER["Vercel build (frontend)<br/>vercel.json = headers only"]
    PUSH --> RWY["Railway build (backend)<br/>project perceptive-determination"]
    VER --> VOK["insyte-1-4.vercel.app ✔ succeeding"]
    RWY --> ROK["insyte-14-production.up.railway.app<br/>✘ failing since ~19 Jul evening"]
    subgraph build script
      B1["vite build → dist/"] --> B2["esbuild server.ts → dist/server.cjs"]
    end
```

Evidence (2026-07-20):
- GitHub commit status on `0dfa908`: Vercel = success, Railway = failure.
- CI green on all recent commits (same npm ci + build on Linux).
- Clean-room repro (git archive → npm ci → npm run build) exits 0 locally.
- Favicon-only commit `0dfa908` also failed on Railway → failure is not code.
- Railway CLI on this machine is logged in as hamza.osama.els@gmail.com and
  cannot see the project (likely owned by insyte.startup@gmail.com workspace)
  → build logs unreachable from here; needs dashboard check (credits/plan/
  settings) by the owner.
