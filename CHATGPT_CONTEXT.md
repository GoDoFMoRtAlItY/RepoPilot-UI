# RepoPilot — Full Project Context & Technical Architecture

> **Last Updated:** 2026-07-27
> This document is the authoritative system prompt and context reference for ChatGPT (or any LLM) to understand **RepoPilot** in complete detail. Paste the entire contents of this file as a system prompt when asking for help with this codebase.

---

## 1. Project Overview & Purpose

**RepoPilot** is a full-stack, production-grade web application that acts as an **interactive codebase onboarding command center** for GitHub repositories. It is designed to help developers—especially newcomers, first-year students, or engineering teams onboarding onto a new codebase—understand complex repositories in minutes instead of days.

A user submits any **public GitHub repository URL**. The backend then:
1. Fetches the full repository file tree and file blobs via the GitHub REST API (Octokit).
2. Parses all JavaScript and TypeScript source files with the **Babel AST parser** (`@babel/parser` + `@babel/traverse`).
3. Extracts structured metadata: API routes, environment variables, entry points, dependency graphs, security vulnerabilities, file roles, and a DX score.
4. Caches all results in an LRU cache and returns a rich JSON payload to the frontend.

The frontend renders this data as a **futuristic, glassmorphism-styled dashboard** with multiple interactive tabs, an AI-powered mentor chatbot, and architecture visualizations.

**Live deployment:** `https://repopilot.xyz` (frontend on Vercel, backend on Render)

---

## 2. Monorepo Structure

```
project-jon-snow/
├── client/                 # React 19 + Vite + TypeScript frontend
├── server/                 # Node.js + Express 5 backend
├── CHATGPT_CONTEXT.md      # This file
├── AI_CONTEXT.md           # Shorter AI context for quick reference
├── README.md               # Project README
├── pilot2_app.tsx          # Legacy monolithic prototype (reference only)
└── render.yaml             # Render deployment configuration
```

---

## 3. Tech Stack

### Frontend (`/client`)

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Language | TypeScript | ~6.0 |
| Build Tool | Vite | 8 |
| Styling | Tailwind CSS | v4 |
| State Management | Zustand | 5 |
| Routing | React Router DOM | 7 |
| Animation | Framer Motion | 12 |
| Smooth Scrolling | Lenis | 1.3 |
| Architecture Graph | @xyflow/react (React Flow) + @dagrejs/dagre | 12 + 3 |
| Charts | Recharts | 3 |
| Icons | Lucide React | 1.18 |
| Markdown Rendering | react-markdown + remark-gfm | 10 |
| Code Highlighting | react-syntax-highlighter | 16 |
| 3D Graphics | @react-three/fiber + @react-three/drei + three.js | 9 + 10 + 0.184 |
| 3D Scenes | @splinetool/react-spline | 4 |
| Auth | Firebase | 12 |
| HTTP Client | axios | 1.18 |

### Backend (`/server`)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js (CommonJS) | LTS |
| Framework | Express | 5 |
| GitHub API | Octokit | 5 |
| AST Parsing | @babel/parser + @babel/traverse | 8 |
| AI (primary) | @google/generative-ai (Gemini) | 0.24 |
| AI (secondary) | OpenRouter, OpenAI, Anthropic via axios | - |
| Caching | lru-cache | 11 |
| Security | Helmet, CORS | 8, 2.8 |
| Logging | Morgan | 1.11 |
| Compression | compression | 1.8 |

---

## 4. Complete Directory Structure

```
project-jon-snow/
│
├── client/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   ├── package.json
│   └── src/
│       ├── main.tsx                    # React app entry point
│       ├── App.tsx                     # Root component: boot sequence, routing, theme
│       ├── App.css
│       ├── index.css                   # Global design system: tokens, glassmorphism, utilities
│       │
│       ├── store/
│       │   ├── useRepoStore.ts         # Zustand store: repo analysis state, API calls
│       │   └── useUIStore.ts           # Zustand store: dark/light theme toggle
│       │
│       ├── hooks/
│       │   └── useAuth.ts              # Firebase auth state hook
│       │
│       ├── lib/                        # Utility helpers
│       │
│       ├── assets/                     # Static assets
│       │
│       └── components/
│           ├── AiAssistantTab.tsx      # Grounded RAG chatbot tab with BYOK support
│           ├── AiPreviewSection.tsx    # Landing page animated AI preview section
│           ├── ApiKeySettings.tsx      # UI panel for entering user-provided AI API keys
│           ├── ApiRoutesTab.tsx        # HTTP route explorer with method badges
│           ├── ArchitectureTab.tsx     # React Flow + Dagre interactive graph
│           ├── EnvVariablesTab.tsx     # Environment variable tracker and documenter
│           ├── FeatureCards.tsx        # Landing page feature cards
│           ├── FeatureShowcase.tsx     # Landing page marketing grid
│           ├── HeroSection.tsx         # GitHub URL input + animated hero
│           ├── HologramRobot.tsx       # Animated hologram visualizer (decorative)
│           ├── ImportantFilesTab.tsx   # File browser + AI summary panel
│           ├── LineByLineAnalysis.tsx  # Line-by-line AI code explanation view
│           ├── LoginPage.tsx           # Firebase Google/Email auth login UI
│           ├── Navbar.tsx              # Top navigation bar
│           ├── OnboardingScoreCard.tsx # DX rating visual grader (0-100)
│           ├── OverviewTab.tsx         # Repository statistics and metadata overview
│           ├── ProfilePage.tsx         # User profile (Firebase account info)
│           ├── ReadmeGeneratorTab.tsx  # AI-powered README.md generator
│           ├── RepositorySnapshot.tsx  # Compact repo snapshot widget
│           ├── SecurityTab.tsx         # Security audit findings display
│           ├── SetupGuideTab.tsx       # Step-by-step project setup guide
│           ├── Sidebar.tsx             # Left-side tab navigation panel
│           ├── TechDebtTab.tsx         # Technical debt radar / code quality analysis
│           └── ui/
│               ├── InteractiveBackground.tsx  # Animated particle/cursor background
│               └── [other base UI components]
│
└── server/
    ├── package.json
    ├── .env                            # Environment secrets (never committed)
    ├── .env.example                    # Template for environment variables
    ├── test_integration.js             # Integration test runner
    │
    └── src/
        ├── index.js                    # Express server bootstrap + middleware + route wiring
        │
        ├── routes/
        │   ├── ai.js                   # POST /api/ai/... — AI provider passthrough routes
        │   ├── analyze.js              # GET /api/analyze/:owner/:repo — full AST analysis
        │   ├── chat.js                 # POST /api/chat — Gemini RAG chatbot
        │   ├── explorer.js             # GET /api/explorer/tree, POST /api/explorer/analyze-line-by-line
        │   ├── readme.js               # POST /api/readme — AI README generator
        │   └── webhook.js              # POST /api/webhook/pr-opened — PR diff analyzer
        │
        ├── services/
        │   ├── aiReadme.js             # AI service for README generation
        │   ├── cache.js                # LRU cache wrapper (singleton)
        │   ├── github.js               # Octokit GitHub API wrapper (file tree, blob content)
        │   ├── metadataExtractor.js    # High-level repo metadata extraction pipeline
        │   ├── parser.js               # Master orchestrator: calls all AST parser modules
        │   │
        │   └── ai/
        │       ├── ProviderManager.js          # Central AI provider router with fallback chain
        │       └── providers/
        │           ├── BaseProvider.js         # Abstract base class with interface
        │           ├── AnthropicProvider.js    # Anthropic Claude integration
        │           ├── GeminiProvider.js       # Google Gemini 2.0 Flash integration
        │           ├── KalavaiProvider.js      # Kalavai local inference integration
        │           ├── LocalProvider.js        # Local Ollama/LM Studio integration
        │           ├── MockProvider.js         # Static mock responses (final fallback)
        │           ├── OpenAIProvider.js       # OpenAI GPT integration
        │           └── OpenRouterProvider.js   # OpenRouter multi-model integration
        │
        ├── parser/
        │   ├── apiIntelligence.js      # Advanced API analysis and categorization
        │   ├── buildGraph.js           # Assembles React Flow node/edge graph from imports
        │   ├── classifyFiles.js        # Tags files with semantic roles
        │   ├── contextCompressor.js    # Compresses large AST contexts for AI prompts
        │   ├── detectEntryPoint.js     # Determines the main entry file
        │   ├── extractApis.js          # Finds external API integrations and packages
        │   ├── extractEnvVars.js       # Detects all process.env.* usages
        │   ├── extractRoutes.js        # Identifies Express/Fastify route definitions
        │   ├── generateDockerSandbox.js # Generates Docker sandbox environment specs
        │   ├── generateSetup.js        # Constructs an ordered setup guide
        │   ├── scoreCalculator.js      # Computes DX Onboarding Score (0-100)
        │   ├── securityScanner.js      # Static security audit: secret leaks, vulnerable deps
        │   ├── treeSitter.js           # (Legacy stub - actual parsing uses @babel/parser)
        │   └── lookups/
        │       └── [JSON definition files for route/library pattern matching]
        │
        └── utils/
            ├── githubUrl.js            # Generates direct GitHub source code hyperlinks
            └── filterFiles.js          # Filters binary files, node_modules, lock files
```

---

## 5. Core Features In Depth

### 5.1 Boot Sequence
When the app first loads, a terminal-style boot sequence plays (6 log lines at 250ms intervals), creating a premium "system initializing" feel. The logs are:
1. Initializing RepoPilot core context pipeline...
2. Mapping Abstract Syntax Tree (AST) parser units...
3. Exposing database schema indexes...
4. Ingesting sandbox environmental specifications...
5. Syncing AI Technical Onboarding Mentor...
6. Hologram projection materialized. System ACTIVE.

### 5.2 Landing Page
- **Hero Section**: Accepts a GitHub URL input. Clicking analyze navigates to `/repo/:owner/:repo`.
- **Feature Cards**: Highlights RepoPilot's top capabilities.
- **AI Preview Section**: Animated preview of the AI chatbot/dashboard.
- **Feature Showcase**: Marketing-style feature grid.
- **Theme Toggle**: Dark/Light mode switch (stored in `useUIStore`).
- **Auth Buttons**: Login/Profile button with Firebase auth integration.

### 5.3 Dashboard Page (`/repo/:owner/:repo`)
The main analysis interface. The `useRepoStore` calls `GET /api/analyze/:owner/:repo` on mount.

**Tab Navigation (Sidebar) — 11 Tabs:**

| Tab | Component | Description |
|---|---|---|
| Overview | `OverviewTab.tsx` | Repo stats: stars, forks, languages, description, contributor info |
| Setup Guide | `SetupGuideTab.tsx` | Ordered install/run steps extracted from package.json, Dockerfile, Makefile |
| Important Files | `ImportantFilesTab.tsx` | File browser + AI 1-3 sentence summary per file |
| Architecture | `ArchitectureTab.tsx` | React Flow + Dagre auto-layout directed graph of file imports |
| APIs & Routes | `ApiRoutesTab.tsx` | Full HTTP method/path list with source file links |
| Env Variables | `EnvVariablesTab.tsx` | Required/optional env keys, defaults, and usage context |
| Security Audit | `SecurityTab.tsx` | CVEs, secret leaks, insecure patterns, and severity ratings |
| Tech Debt Radar | `TechDebtTab.tsx` | Code quality analysis: dead code, complexity, outdated deps |
| Onboarding Score | `OnboardingScoreCard.tsx` | DX score (0-100) with breakdown by category |
| README Generator | `ReadmeGeneratorTab.tsx` | AI-generated README.md with copy/download functionality |
| AI Assistant | `AiAssistantTab.tsx` | Grounded RAG chatbot anchored to the analyzed repo context |

### 5.4 Line-by-Line Analysis (`/repo/:owner/:repo/analyze`)
A dedicated full-page view showing a specific file's source code with an AI-generated, markdown-formatted line-by-line technical breakdown. Triggered from the Important Files tab.

### 5.5 AI Provider System (BYOK + Fallback Chain)

The `ProviderManager.js` (singleton) manages ALL AI calls:

1. **Primary Provider**: Set via `AI_PROVIDER` env variable (default: `openrouter`).
2. **Configured Fallbacks**: Automatically detects which providers have API keys and builds a fallback chain.
3. **Mock Provider**: Always the final fallback — returns static placeholder responses so the app never crashes.
4. **BYOK (Bring Your Own Key)**: Users can input their own API keys in the `ApiKeySettings` panel. These are passed as `X-AI-Key` and `X-AI-Provider` HTTP headers. When an explicit provider is given, ONLY that provider is used (no fallback to mock).
5. **SHA-256 Caching**: All AI responses are cached keyed by method name + arguments hash.
6. **Typed Error Responses**: Returns structured codes (`AI_KEY_MISSING`, `AI_AUTH_FAILED`, `AI_CREDITS_REQUIRED`, `AI_RATE_LIMITED`, `AI_PROVIDER_UNAVAILABLE`) for frontend error messaging.

Supported providers:
- `gemini` — Google Gemini 2.0 Flash
- `openrouter` — OpenRouter (many models, incl. free tier)
- `openai` — OpenAI GPT-4o / GPT-4 mini
- `anthropic` — Anthropic Claude 3.5+
- `kalavai` — Kalavai distributed inference
- `local` — Local Ollama/LM Studio via `LOCAL_AI_URL`
- `mock` — Static fallback (no API key needed)

### 5.6 Authentication (Firebase)
- Google Sign-In and Email/Password login via Firebase Auth.
- `useAuth.ts` hook listens to `onAuthStateChanged`.
- `LoginPage.tsx` and `ProfilePage.tsx` handle auth UI.
- Auth state is independent from repo analysis state.

---

## 6. API Endpoints (Complete Reference)

### Base URLs
- **Development**: `http://localhost:3001`
- **Production**: Render-hosted backend (CORS: `https://repopilot.xyz`)

### Route Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check. Returns `{ status: 'ok', timestamp }` |
| `GET` | `/api/analyze/:owner/:repo` | Full GitHub repo analysis. Returns routes, envVars, score, graph, securityAlerts, setupSteps, entryPoint, files, metadata |
| `POST` | `/api/chat` | RAG chatbot. Body: `{ question, owner, repo }`. Headers: `X-AI-Key`, `X-AI-Provider`. Returns AI response grounded in repo context |
| `GET` | `/api/explorer/tree` | Fetch flat file tree. Query: `?url=<github_url>`. Returns owner, repo, defaultBranch, commitSha, files[] |
| `POST` | `/api/explorer/analyze-line-by-line` | AI line-by-line file analysis. Body: `{ owner, repo, path, sha }`. Headers: `X-AI-Key`, `X-AI-Provider` |
| `POST` | `/api/readme` | AI README generation. Body: `{ owner, repo, analysisData? }` |
| `POST` | `/api/webhook/pr-opened` | GitHub PR webhook. Compares PR branch AST vs cached base. Returns diff of routes/envVars/score |
| `POST` | `/api/ai/*` | Direct AI provider passthrough routes for frontend BYOK flows |

### Custom Request Headers

| Header | Purpose |
|---|---|
| `X-AI-Key` | User-provided API key (BYOK) |
| `X-AI-Provider` | Override provider: `gemini`, `openrouter`, `openai`, `anthropic` |

---

## 7. State Management

### `useRepoStore.ts` (primary Zustand store)

**State fields:**
- `analyzedRepo` — Currently analyzed `owner/repo` string.
- `currentTab` — Active dashboard tab name.
- `analysisData` — Full parsed response from `/api/analyze`.
- `isLoading` / `error` — Loading/error state.
- `repoInfo` — GitHub repo metadata (stars, forks, language, etc.).
- `files` — Repository file list.
- `routes` — Extracted API routes array.
- `envVars` — Extracted environment variables array.
- `securityAlerts` — Security findings array.
- `setupSteps` — Ordered setup instructions.
- `architectureGraph` — `{ nodes, edges }` for React Flow.
- `score` — DX Onboarding Score (0-100).
- `entryPoint` — Detected entry file path.

**Key actions:**
- `analyzeRepo(owner, repo)` — Calls `/api/analyze/:owner/:repo`, populates all state.
- `setCurrentTab(tab)` — Switches the active dashboard tab.
- `reset()` — Clears all analysis state.

### `useUIStore.ts` (theme Zustand store)
- `theme` — `'dark'` | `'light'` (applied as class on root `<div>`).
- `toggleTheme()` — Switches between dark and light modes.

---

## 8. Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `3001` | Express server port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Comma-separated allowed CORS origins |
| `GITHUB_TOKEN` | **Yes** | — | GitHub PAT (5,000 req/hr rate limit) |
| `AI_PROVIDER` | No | `openrouter` | Primary AI provider |
| `OPENROUTER_API_KEY` | No* | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `openrouter/free` | Specific model slug to use on OpenRouter |
| `GEMINI_API_KEY` | No* | — | Google Gemini API key |
| `OPENAI_API_KEY` | No* | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | No* | — | Anthropic Claude API key |
| `KALAVAI_API_KEY` | No* | — | Kalavai API key |
| `LOCAL_AI_URL` | No* | — | Local Ollama/LM Studio endpoint URL |

*At least one AI provider key recommended. Without any key, the Mock provider is used.

---

## 9. Frontend Design System

### Design Philosophy
- **Theme**: Glassmorphism + futuristic HUD aesthetic.
- **Color Tokens**: CSS custom properties defined in `index.css` (e.g. `var(--accent-primary)`, `var(--bg-primary)`, `var(--glass-border)`).
- **Dark/Light Modes**: Toggled via `theme` class on root `<div>`. Tailwind's `dark:` variant used throughout.
- **Typography**: `font-mono` for terminal/hacker accents. Sans-serif for body text.
- **Animations**: Framer Motion for page transitions (`AnimatePresence`) and micro-animations. CSS keyframes for pulsing/glowing effects.
- **Background**: `InteractiveBackground` renders an animated particle/cursor-reactive canvas layer.

### Key CSS Utility Classes (`index.css`)
- `glass-panel` — Frosted glass card (backdrop-blur + semi-transparent bg + border).
- `base-btn` — Primary action button with gradient + hover effect.
- `text-primary`, `text-secondary`, `text-tertiary` — Semantic text color helpers.

---

## 10. AST Parsing Pipeline (Server)

When `GET /api/analyze/:owner/:repo` is called, the following pipeline runs:

1. **`github.js`** → Fetches repo metadata, default branch, recursive file tree via Octokit.
2. **`filterFiles.js`** → Strips binaries, `node_modules`, lock files, `.git` contents.
3. **`github.js`** → Downloads raw blob content for each analyzable file.
4. **`parser.js`** (orchestrator) → Runs all parser modules:
   - **`detectEntryPoint.js`** → Finds `index.js`, `app.ts`, `main.py`, etc.
   - **`classifyFiles.js`** → Tags each file: `Config`, `Component`, `Route`, `Service`, `Test`, etc.
   - **`extractRoutes.js`** → Identifies `app.get()`, `router.post()`, `@Get()`, etc.
   - **`extractEnvVars.js`** → Finds all `process.env.VARIABLE` references.
   - **`extractApis.js`** → Detects external API imports and usage patterns.
   - **`buildGraph.js`** → Reads import statements to build a directed file dependency graph.
   - **`generateSetup.js`** → Parses `package.json` scripts, `Dockerfile`, `Makefile` for setup steps.
   - **`securityScanner.js`** → Checks for known vulnerable packages, hardcoded secrets, `eval()`, etc.
   - **`scoreCalculator.js`** → Computes DX score: README quality, env var docs, Docker presence, test files, lint config, entry point clarity.
   - **`apiIntelligence.js`** → Deeper API usage categorization.
5. **`metadataExtractor.js`** → Combines all outputs into one structured payload.
6. **`cache.js`** → Stores result in LRU cache keyed by `owner/repo`.
7. Response returned to frontend.

---

## 11. Frontend Routes

| Path | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Landing page with URL input |
| `/login` | `LoginPage` | Firebase login/signup |
| `/profile` | `ProfilePage` | User account details |
| `/repo/:owner/:repo` | `DashboardPage` | Main analysis dashboard (11 tabs) |
| `/repo/:owner/:repo/analyze` | `LineByLineAnalysis` | Single-file deep analysis view |
| `*` | Redirect to `/` | 404 fallback |

---

## 12. Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | `vercel.json` |
| Backend | Render | `render.yaml` |

- Frontend: `https://repopilot.xyz`
- Backend CORS: `CORS_ORIGIN=https://repopilot.xyz`
- Backend port: `3001` (configurable via `PORT` env).

---

## 13. Key Architectural Conventions

1. **CommonJS on server** (`require`/`module.exports`). Server `package.json` sets `"type": "commonjs"`.
2. **ESM on client** (`import`/`export`). Client `package.json` sets `"type": "module"`.
3. **All AI calls go through `ProviderManager.execute(methodName, ...args)`** — never call provider classes directly.
4. **BYOK headers** (`X-AI-Key`, `X-AI-Provider`) must be forwarded in every new AI-touching route handler.
5. **Cache-first**: Always `cache.has(key)` before expensive GitHub or AI calls.
6. **MockProvider** always returns schema-conforming placeholder data — never throws.
7. **`currentTab` in `useRepoStore`** controls which component is rendered in the dashboard.
8. **Actual AST engine is `@babel/parser`** — `treeSitter.js` is a legacy stub, do not use it.
9. The server listens for both `X-AI-Key` (user BYOK key) and `X-AI-Provider` (specific provider override) on all AI-related routes.
10. **Rate limiting**: GitHub API calls are made with a PAT for 5,000 req/hr. Without a token, the limit is 60 req/hr.

---

## 14. Quick Start (Development)

```bash
# 1. Clone
git clone https://github.com/GoDoFMoRtAlItY/RepoPilot-UI.git
cd RepoPilot-UI

# 2. Backend setup
cd server
cp .env.example .env
# Fill in GITHUB_TOKEN and at least one AI provider key in .env
npm install
npm run dev          # Starts on http://localhost:3001

# 3. Frontend setup (new terminal)
cd ../client
npm install
npm run dev          # Starts on http://localhost:5173
```

---

## 15. Key File Summaries

| File | Summary |
|---|---|
| `server/src/index.js` | Express app initialization. Loads all middleware (helmet, cors, compression, morgan). Wires all 6 route groups. Starts server on `PORT`. |
| `server/src/services/ai/ProviderManager.js` | Singleton that routes AI method calls through a configured fallback chain (primary provider → other configured providers → mock). Handles SHA-256 caching, BYOK key injection, and structured error responses. |
| `server/src/routes/analyze.js` | Core analysis endpoint. Orchestrates GitHub fetching + AST parsing + caching. Returns the full analysis payload. |
| `server/src/routes/explorer.js` | Two endpoints: `GET /tree` (returns all repo files flat-listed) and `POST /analyze-line-by-line` (fetches blob + sends to ProviderManager for line-by-line AI explanation). |
| `server/src/parser/buildGraph.js` | Reads Babel AST import declarations to build `{ nodes, edges }` compatible with React Flow. |
| `server/src/parser/scoreCalculator.js` | Scores repos 0-100 across DX dimensions. Returns numeric score + per-category breakdown. |
| `client/src/App.tsx` | Root component: shows terminal boot sequence, manages dark/light theme class on root div, sets up all React Router routes, wraps everything in `InteractiveBackground`. |
| `client/src/store/useRepoStore.ts` | Zustand store: single source of truth for all repository analysis data, loading states, and active tab. |
| `client/src/components/AiAssistantTab.tsx` | Full chat UI with message history, BYOK key input passthrough, and AI provider selector. Sends requests to `/api/chat`. |
| `client/src/components/ArchitectureTab.tsx` | Renders the `architectureGraph` from the store using React Flow + Dagre for auto-layout. Supports zoom, pan, and node selection. |
| `client/src/components/ReadmeGeneratorTab.tsx` | Sends repo analysis context to `/api/readme`, displays the AI-generated markdown, supports copying and downloading as `.md`. |
| `client/src/components/TechDebtTab.tsx` | Displays technical debt radar: identifies outdated dependencies, code complexity hotspots, and dead code patterns. |
| `client/src/components/LoginPage.tsx` | Firebase Google Sign-In + Email/Password login with premium styled UI. |
