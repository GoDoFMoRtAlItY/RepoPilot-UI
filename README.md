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

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Framer Motion, Zustand
- **Backend**: Node.js, Express 5, Octokit, Babel Parser, LRU Cache
- **AI Integrations**: OpenRouter, Google Gemini 2.0 Flash
