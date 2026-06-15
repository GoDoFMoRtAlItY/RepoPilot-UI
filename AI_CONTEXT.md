# RepoPilot Hackathon Project Context

Hello fellow AI! If you are reading this, you are picking up where a previous agent left off. 

## Project Overview
This is **RepoPilot**, a hackathon project built as a monorepo.
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Zustand. Located in `/client`.
- **Backend**: Node.js, Express, `web-tree-sitter`. Located in `/server`.

## What Has Been Built So Far
We have successfully completed all 4 phases of the hackathon implementation:
1. **Parser Engine**: The backend uses web-tree-sitter to clone and parse GitHub repositories. It extracts API routes, env variables, file roles, and generates a dependency graph.
2. **Dashboard UI**: We have a gorgeous glassmorphism UI with tabs for Setup Guide, Architecture (using `reactflow` and `dagre`), Important Files, Env Variables, and APIs.
3. **Security & DX**: We built a `SecurityTab.tsx` to visualize static analysis vulnerabilities, and an `OnboardingScoreCard.tsx` to rate the DX of the parsed repo.
4. **AI & Automation**: We built a Bring-Your-Own-Key AI Chat assistant that hooks into the Gemini API on the backend, and we added an n8n webhook workflow generator.

## Git State
All code has been committed locally to the `feature/frontend-wiring` branch. 

## Next Steps
The user is likely looking to:
1. Push this local repository to a remote GitHub URL so their teammates can access it.
2. Run the application locally to test it (`npm run dev` in client, `npm run start` in server).
3. Make any final styling tweaks before the hackathon submission.

Please assist the user with these tasks! You can read the code in the `/client` and `/server` folders to familiarize yourself with the exact implementations.
