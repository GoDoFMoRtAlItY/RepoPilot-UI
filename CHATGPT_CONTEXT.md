# RepoPilot Project Context & Technical Architecture

This document serves as a comprehensive system prompt and context file for ChatGPT (or any LLM) to understand **RepoPilot**—its features, file structure, codebase architecture, and implementation details.

---

## 1. Project Overview & Pitch
**RepoPilot** is an interactive, developer-onboarding and codebase-visualization platform built for hackathons. It helps developers (especially newcomers or first-year students) quickly understand a new codebase. 

By inputting a public GitHub repository URL, RepoPilot fetches, analyzes, and parses the project's codebase to generate a stunning, glassmorphism dashboard containing dependency graphs, api endpoints, environment variables, security audits, DX ratings, and an AI-powered technical onboarding mentor.

---

## 2. Tech Stack & Technologies
The project is built as a Monorepo split into a frontend client and backend server:

### Frontend (`/client`)
- **Framework**: React 19 (TypeScript) initialized with Vite.
- **Styling**: Tailwind CSS (v4) with vanilla CSS utility layers for premium glassmorphism visuals.
- **State Management**: Zustand (for reactive repository analysis store).
- **Routing**: React Router DOM (v7).
- **Visuals & Motion**: Framer Motion (page transitions and interactive dashboard widgets) and Lenis (for smooth scrolling).
- **Visualizations**: 
  - `@xyflow/react` (React Flow) combined with `@dagrejs/dagre` for automated node layouting of the visual architecture and dependency graph.
  - Recharts (for scoring and breakdown visualizers).
  - Lucide React (icons).

### Backend (`/server`)
- **Runtime**: Node.js with Express.
- **GitHub Ingestion**: `octokit` to retrieve recursive file trees, meta information, and repository blobs.
- **AST Parsing Engine**: `web-tree-sitter` (configured for Javascript and Typescript parsing) to extract routes, APIs, and import/export linkages.
- **AI RAG & Chat Service**: `@google/generative-ai` (Gemini 2.0 Flash) with a Bring-Your-Own-Key (BYOK) paradigm.
- **File Summarization & Line-by-Line Explanation Service**: Gemini API (model `gemini-2.0-flash`) with simulated fallback placeholders.
- **Caching**: `lru-cache` for storing AST and GitHub fetch results.
- **Security & Middlewares**: Helmet, compression, CORS, Morgan logging.

---

## 3. Core Features & Capabilities

1. **AST Parser Engine**: The backend clones, filters, and parses JS/TS files. It extracts API route paths, env variables, dependency imports, file roles, and calculates call chains.
2. **Dashboard HUD UI**: A futuristic glassmorphism theme equipped with multiple interactive tabs:
   - **Overview**: Repository stats, description, and primary languages.
   - **Setup Guide**: Dynamically extracted setups (e.g. npm installs, Docker runs, build scripts, default environment variables) mapped in order.
   - **Important Files & Code Explorer**: A file browser that details what each file does. Includes an **"Analyze each line"** feature that gives a line-by-line explanation of any code file.
   - **Architecture Graph**: Auto-directed interactive 2D node map showcasing file relationships, api linkages, and entry points using React Flow.
   - **APIs & Routes**: Complete list of HTTP methods, paths, and source code reference links.
   - **Env Variables**: Analyzed required and optional environment keys, default values, and reference links.
   - **Security Audit**: Static code analysis that scans for vulnerable libraries, potential secret leaks, and insecure setups.
   - **Onboarding Score**: A developer experience rating (0-100) scoring the repository on factors like README detail, env variable documentation, dockerization, tests, lint configuration, and entry-point clarity.
   - **AI Assistant**: A grounded RAG chat bot that uses the repository analysis data to answer onboarding questions and output source-code references with direct GitHub hyperlinks.
3. **PR Ingestion Webhook**: A webhook endpoint (`/api/webhook/pr-opened`) that monitors pull requests, compares AST analyses, and generates a diff of routes added, env variables changed, security score variations, and new vulnerabilities.

---

## 4. Codebase Directory Structure
```
pilot2/
├── client/                     # Frontend client workspace
│   ├── src/
│   │   ├── main.tsx            # Entry point for React app
│   │   ├── App.tsx             # Main router and landing/dashboard page layouts
│   │   ├── index.css           # Core styling tokens, utility classes, animations
│   │   ├── App.css
│   │   ├── store/
│   │   │   └── useRepoStore.ts # Zustand store managing analysis state and API requests
│   │   └── components/         # Dashboard tabs & visual widgets
│   │       ├── AiAssistantTab.tsx       # Grounded chat bot interface
│   │       ├── AiPreviewSection.tsx     # Landing page animation preview
│   │       ├── ApiRoutesTab.tsx         # HTTP Route explorer
│   │       ├── ArchitectureTab.tsx      # React Flow + Dagre diagram builder
│   │       ├── EnvVariablesTab.tsx      # Env variable tracking
│   │       ├── FeatureShowcase.tsx      # Marketing grid
│   │       ├── HeroSection.tsx          # GitHub URL input & loading flow
│   │       ├── HologramRobot.tsx        # Dynamic decorative chatbot visualizer
│   │       ├── ImportantFilesTab.tsx    # Code explorer & file summarizer panel
│   │       ├── LineByLineAnalysis.tsx   # Detailed file code explainer view
│   │       ├── Navbar.tsx               # Top header
│   │       ├── OnboardingScoreCard.tsx  # Interactive DX visual grading metric
│   │       ├── OverviewTab.tsx          # High-level statistics
│   │       ├── SecurityTab.tsx          # Security alerts list
│   │       ├── SetupGuideTab.tsx        # Project setup walkthrough
│   │       ├── Sidebar.tsx              # Tab navigation panel
│   │       └── ui/                      # Base cards, buttons, etc.
│   └── package.json
│
└── server/                     # Backend server workspace
    ├── src/
    │   ├── index.js            # Main Express server configuration & routing wire-up
    │   ├── parser/             # Low-level AST parsing modules (web-tree-sitter)
    │   │   ├── treeSitter.js       # Core tree-sitter parser initialization
    │   │   ├── extractRoutes.js    # Identifies router paths and actions
    │   │   ├── extractEnvVars.js   # Detects usages of process.env
    │   │   ├── extractApis.js      # Finds external package APIs and integrations
    │   │   ├── detectEntryPoint.js # Determines primary entry-point (e.g. index.js, app.ts)
    │   │   ├── classifyFiles.js    # Tags files with roles (Config, Component, Route, etc.)
    │   │   ├── buildGraph.js       # Assembles Node/Edge representations for React Flow
    │   │   ├── generateSetup.js    # Constructs step-by-step setup guides
    │   │   ├── securityScanner.js  # Runs static audit rules on code and packages
    │   │   ├── scoreCalculator.js  # Computes DX ratings based on file tags/structures
    │   │   └── lookups/            # JSON definition files for matching routes/libraries
    │   ├── routes/             # Controller routing endpoints
    │   │   ├── analyze.js      # Triggers full GitHub repository AST analysis
    │   │   ├── chat.js         # Endpoint for Gemini RAG chatbot
    │   │   ├── explorer.js     # Folder tree explorer and file explainer routes
    │   │   └── webhook.js      # PR opened webhook analyzer
    │   ├── services/           # Service-level logic and API connectors
    │   │   ├── github.js       # GitHub API integration (Octokit)
    │   │   ├── parser.js       # Orchestrator coordinating all AST steps
    │   │   ├── aiChat.js       # Gemini 2.0 prompt grounder and fallback answers
    │   │   ├── summarizer.js   # Gemini API integration for summarizing files & lines
    │   │   └── cache.js        # Server-side Cache (lru-cache) wrapper
    │   └── utils/
    │       ├── githubUrl.js    # Generates exact code location links for GitHub
    │       └── filterFiles.js  # Filters out binary files and node_modules
    └── package.json
```

---

## 5. API Endpoints
- **GET** `/api/analyze/:owner/:repo`  
  Triggers a repository download and AST analysis. Returns full structured metadata including routes, env variables, score, entry point, security alerts, and setup steps.
- **POST** `/api/chat`  
  Accepts a custom `question` along with the repository `owner` and `repo` names. Matches it against the cached repository analysis to ground responses using Gemini.
- **POST** `/api/explorer/summary`  
  Generates a friendly 1-to-3 sentence overview of a file's responsibility using the Gemini API.
- **POST** `/api/explorer/analyze-line-by-line`  
  Generates a detailed, Markdown-formatted line-by-line breakdown of a target source code file.
- **POST** `/api/webhook/pr-opened`  
  Listens to PR opening payloads, compares the branch's code quality/structure against current cached status, and outputs a quality diff.
