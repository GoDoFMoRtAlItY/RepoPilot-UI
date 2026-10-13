# RepoPilot UI

**RepoPilot UI is an interactive codebase onboarding command center for analyzing GitHub repositories.**

## About the Project

### What the Repository is For
This repository provides the full web application codebase for RepoPilot UI, serving as the central hub for automated repository analysis, static code inspection, architecture visualization, and AI-driven documentation generation.

### What It Is
RepoPilot UI is a full-stack web application organized around a decoupled client-server architecture. The frontend is built with React, Vite, and Tailwind CSS, featuring interactive dashboards, dependency trees, security audits, and onboarding command tabs. The backend is an Express server running static analysis services, AST parsers, metadata extractors, and multi-provider AI integrations.

### How It Works
Execution starts from the backend entry point at `server/src/index.js` and frontend entry point at `client/src/main.tsx`. When a user submits a GitHub repository URL, the server fetches repository file structures via the GitHub API, parses source files with Babel AST parsers, extracts route definitions and environment requirements, and calculates security and architecture scores. The frontend renders this structured metadata into interactive visual panels.

### How It Is Used
Developers and engineering teams can use RepoPilot UI to onboard onto new codebases quickly. By analyzing any public repository, users can inspect API endpoints, environment variables, security posture, dependency relationships, and generate human-written README documentation.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/GoDoFMoRtAlItY/RepoPilot-UI.git
cd RepoPilot-UI

# Install server dependencies and start backend
cd server
npm install
npm run dev

# Open a new terminal, install client dependencies and start frontend
cd ../client
npm install
npm run dev
```

The frontend application will run at http://localhost:5173/ and connect to the backend server at http://localhost:3001.

## Environment Variables

Configure the following variables in `server/.env`:

| Key | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `3001` | Backend HTTP server port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origins |
| `GITHUB_TOKEN` | Yes | - | GitHub Personal Access Token for API rate limit (5,000 req/hr) |
| `AI_PROVIDER` | No | `openrouter` | Primary AI provider (openrouter or gemini) |
| `OPENROUTER_API_KEY` | No | - | OpenRouter API Key for AI features |
| `GEMINI_API_KEY` | No | - | Gemini API Key for AI features |

## Time Machine (Gemma 4)

Every file has a story. In **Important Files**, expand a file and click **Tell this file's story** to see how it evolved: when it was created, the milestone commits that changed its responsibilities, renames and moves, and how today's version differs from the first one. The **Time Machine** tab shows the repository's major milestones.

- Git establishes what changed and when (commits, diffs, renames, imports, functions, routes). Gemma 4 explains what the changes mean, using milestone refs only, and its JSON is schema-validated before it is shown. Explanations are labelled as Gemma inferences; reasons are only given when the commit message or diff supports them.
- History is fetched lazily, only when a story is opened. A typical file story costs 1-2 commit-list calls per path (one more per rename followed), up to 20 commit-detail calls (cached per SHA forever), 2 content calls and **one** Gemma call. Reopening an unchanged file is served from cache with no GitHub detail calls and no Gemma call. The repository timeline costs about 1 + 1 + 12 GitHub calls and one Gemma call, and analyses only the latest 100 commits (flagged when older history exists).
- If Gemma is not configured or fails, both views still work and show the Git facts.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/time-machine/file-story` `{ owner, repo, path, ref?, refresh? }` | Story for one file |
| `GET /api/time-machine/:owner/:repo/commit/:sha?path=` | Lazy diff for one commit and file |
| `POST /api/time-machine/repo-evolution` `{ owner, repo, ref?, refresh? }` | Repository milestones |

Gemma is reached through the first configured backend: `GEMINI_API_KEY` (model `gemma-4-31b-it`), `OPENROUTER_API_KEY` (model `google/gemma-4-31b-it`) or a local `OLLAMA_URL` (model `gemma4:e4b`). Override with `GEMMA_BACKEND`, `GEMMA_MODEL` and `GEMMA_OLLAMA_MODEL`. Run the server tests with `cd server && npm test`.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Framer Motion, Zustand
- **Backend**: Node.js, Express 5, Octokit, Babel Parser, LRU Cache
- **AI Integrations**: OpenRouter, Google Gemini 2.0 Flash
