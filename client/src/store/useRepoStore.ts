import { create } from 'zustand'

export interface SetupStep {
  id: number
  title: string
  description: string
  command: string
  status: 'pending' | 'running' | 'success' | 'failed'
  details: string
}

export interface ImportantFile {
  path: string
  importance: 'High' | 'Medium' | 'Low'
  purpose: string
  category: 'Config' | 'Source' | 'Entrypoint' | 'Build'
  details: string
}

export interface ApiRoute {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  auth: boolean
  parameters: string[]
}

export interface EnvVariable {
  name: string
  required: boolean
  defaultValue: string
  description: string
  status: 'configured' | 'missing' | 'optional-missing'
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  codeBlock?: {
    language: string
    code: string
  }
}

interface RepoStore {
  currentTab: string
  analyzedRepo: string
  isAnalyzing: boolean
  analysisProgress: number
  setupSteps: SetupStep[]
  importantFiles: ImportantFile[]
  apiRoutes: ApiRoute[]
  envVariables: EnvVariable[]
  chatMessages: ChatMessage[]
  searchQueryFiles: string
  searchQueryApis: string
  
  // Actions
  setCurrentTab: (tab: string) => void
  setAnalyzedRepo: (repo: string) => void
  startAnalysis: () => void
  runSetupStep: (id: number) => void
  sendChatMessage: (text: string) => void
  setSearchQueryFiles: (query: string) => void
  setSearchQueryApis: (query: string) => void
}

export const useRepoStore = create<RepoStore>((set) => ({
  currentTab: 'Overview',
  analyzedRepo: 'repopilot/onboarding-engine',
  isAnalyzing: false,
  analysisProgress: 100,
  searchQueryFiles: '',
  searchQueryApis: '',

  setupSteps: [
    {
      id: 1,
      title: 'Verify Prerequisites',
      description: 'Check if Node.js v18+, Docker, and Git are installed on your workstation.',
      command: 'node -v && git --version && docker --version',
      status: 'success',
      details: 'All prerequisites verified. Current node version: v24.15.0, Git version: v2.53.0. Docker daemon detected and running.'
    },
    {
      id: 2,
      title: 'Configure Local Environment',
      description: 'Clone the environment file and prepare local configurations.',
      command: 'cp .env.example .env.local',
      status: 'pending',
      details: 'Creates local configurations. You will need to fill out the API keys in the next step.'
    },
    {
      id: 3,
      title: 'Install Project Dependencies',
      description: 'Run package installation command with legacy-peer-deps for React compatibility.',
      command: 'npm install --legacy-peer-deps',
      status: 'pending',
      details: 'Installs all required dependencies including Framer Motion, Zustand, Three, and React Flow. Expected time: 10-15s.'
    },
    {
      id: 4,
      title: 'Initialize Docker Services',
      description: 'Start PostgreSQL and Redis local cache nodes using Docker Compose.',
      command: 'docker-compose up -d',
      status: 'pending',
      details: 'Fires up PostgreSQL database node on port 5432 and Redis cache node on port 6379 in detached mode.'
    },
    {
      id: 5,
      title: 'Execute Database Migrations',
      description: 'Run Prisma/Sequelize schema synchronization commands to prepare database.',
      command: 'npm run db:migrate && npm run db:seed',
      status: 'pending',
      details: 'Applies outstanding SQL schema migrations to your local postgres cluster and initializes static seeds.'
    },
    {
      id: 6,
      title: 'Launch Local Sandbox Server',
      description: 'Start Vite development server and launch the onboard assistant core.',
      command: 'npm run dev',
      status: 'pending',
      details: 'Starts hot-reloaded dev server. By default maps to http://localhost:5173'
    }
  ],

  importantFiles: [
    {
      path: 'src/main.tsx',
      importance: 'High',
      purpose: 'Application entry point where React core is mounted to DOM.',
      category: 'Entrypoint',
      details: 'Mounts the React application with global providers. Initializes the React StrictMode and references index.css. Change this file only if you are adding global wrapper providers.'
    },
    {
      path: 'src/App.tsx',
      importance: 'High',
      purpose: 'Root layout router and view coordinator controlling Landing Page and Dashboard views.',
      category: 'Entrypoint',
      details: 'Coordinates animations and transition controls between the landing grid hero and the dashboard hub. Manages the global state checks for workspace loaded flags.'
    },
    {
      path: 'vite.config.ts',
      importance: 'Medium',
      purpose: 'Vite build tool configuration containing Tailwind CSS v4 pipeline integrations.',
      category: 'Config',
      details: 'Defines the bundler behavior. Includes the @tailwindcss/vite plugin. Any aliases or bundler plugins must be registered here.'
    },
    {
      path: 'src/store/useRepoStore.ts',
      importance: 'High',
      purpose: 'Zustand state store managing the interactive dashboard data matrices.',
      category: 'Source',
      details: 'The single source of truth for the RepoPilot dashboard. Manages simulated commands, active view states, AI messages, and repository schema profiles.'
    },
    {
      path: 'package.json',
      importance: 'High',
      purpose: 'Manifest file declaring external packages, commands, and engine targets.',
      category: 'Config',
      details: 'Contains the complete dependency trees. Used by package managers to initialize workspace trees.'
    },
    {
      path: 'eslint.config.js',
      importance: 'Low',
      purpose: 'JavaScript/TypeScript code standards and formatting checker guidelines.',
      category: 'Config',
      details: 'Configures stylistic rules, warning bounds, and parsing structures for ESLint. Adjust only when changing lint formatting strictness.'
    },
    {
      path: 'src/components/HologramRobot.tsx',
      importance: 'High',
      purpose: 'Interactive 3D Three.js mesh representing the Friendly AI onboarding companion.',
      category: 'Source',
      details: 'Loads and rotates the futuristic HUD robot mesh. Reacts to cursor movement for parallax and handles wireframe animations.'
    },
    {
      path: 'src/components/ArchitectureTab.tsx',
      importance: 'High',
      purpose: 'Visual schematic canvas showing code layers and network mapping.',
      category: 'Source',
      details: 'Initializes the React Flow workspace, configures glowing connections, and manages layout overlays for the custom node types.'
    }
  ],

  apiRoutes: [
    {
      path: '/api/v1/auth/github',
      method: 'GET',
      description: 'Initiates GitHub OAuth flow to sync external workspaces.',
      auth: false,
      parameters: ['code', 'state']
    },
    {
      path: '/api/v1/repos/analyze',
      method: 'POST',
      description: 'Triggers the AI ingestion pipeline on a newly integrated repository.',
      auth: true,
      parameters: ['repo_url', 'branch']
    },
    {
      path: '/api/v1/repos/:id/structure',
      method: 'GET',
      description: 'Retrieves parsed module trees and dependency weights.',
      auth: true,
      parameters: ['depth', 'include_tests']
    },
    {
      path: '/api/v1/chat/ask',
      method: 'POST',
      description: 'Dispatches natural language query to the codebase context model.',
      auth: true,
      parameters: ['query', 'conversation_id', 'stream']
    },
    {
      path: '/api/v1/setup/status',
      method: 'GET',
      description: 'Pulls the dynamic checklist execution scores of local work units.',
      auth: true,
      parameters: []
    },
    {
      path: '/api/v1/setup/execute',
      method: 'POST',
      description: 'Executes onboarding command wrappers inside the workspace terminal.',
      auth: true,
      parameters: ['step_id']
    }
  ],

  envVariables: [
    {
      name: 'GITHUB_ACCESS_TOKEN',
      required: true,
      defaultValue: '',
      description: 'API key for GitHub API rate limits. Essential for reading public/private codebase trees.',
      status: 'configured'
    },
    {
      name: 'REPO_PILOT_KEY',
      required: true,
      defaultValue: '',
      description: 'License and API routing credential verifying RepoPilot cloud server handshakes.',
      status: 'configured'
    },
    {
      name: 'POSTGRES_DB_URL',
      required: true,
      defaultValue: 'postgresql://postgres:postgres@localhost:5432/repopilot',
      description: 'Active database connection URI directing migrations and data reads.',
      status: 'missing'
    },
    {
      name: 'REDIS_CACHE_URL',
      required: false,
      defaultValue: 'redis://localhost:6379/0',
      description: 'Cache layer cache locator. Optional, skips memory database if omitted.',
      status: 'optional-missing'
    },
    {
      name: 'PORT',
      required: false,
      defaultValue: '5173',
      description: 'Dev sandbox port mapping configuration override.',
      status: 'configured'
    }
  ],

  chatMessages: [
    {
      id: 'm1',
      sender: 'assistant',
      text: "Hello! I am your RepoPilot Onboarding Assistant. I've successfully analyzed **repopilot/onboarding-engine**. I can help you understand the architecture, guide you through setup steps, locate files, or query APIs. \n\nWhat would you like to build or inspect first?",
      timestamp: '01:15'
    }
  ],

  setCurrentTab: (tab: string) => set({ currentTab: tab }),
  
  setAnalyzedRepo: (repo: string) => {
    set({ analyzedRepo: repo, isAnalyzing: true, analysisProgress: 0 })
    // Simulate repo analysis progression
    const interval = setInterval(() => {
      set(state => {
        if (state.analysisProgress >= 100) {
          clearInterval(interval)
          return { isAnalyzing: false, analysisProgress: 100 }
        }
        return { analysisProgress: state.analysisProgress + 20 }
      })
    }, 400)
  },

  startAnalysis: () => {
    set({ isAnalyzing: true, analysisProgress: 0 })
    const interval = setInterval(() => {
      set(state => {
        if (state.analysisProgress >= 100) {
          clearInterval(interval)
          return { isAnalyzing: false, analysisProgress: 100 }
        }
        return { analysisProgress: state.analysisProgress + 10 }
      })
    }, 250)
  },

  runSetupStep: (id: number) => {
    set(state => ({
      setupSteps: state.setupSteps.map(step => 
        step.id === id ? { ...step, status: 'running' } : step
      )
    }))

    // Simulate completion
    setTimeout(() => {
      set(state => ({
        setupSteps: state.setupSteps.map(step => 
          step.id === id ? { ...step, status: 'success', details: `Execution complete. Exit Code: 0 (SUCCESS). Output: ${step.command} executed in system shell.` } : step
        )
      }))
    }, 1500)
  },

  sendChatMessage: (text: string) => {
    const userMsg: ChatMessage = {
      id: `m_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    set(state => ({ chatMessages: [...state.chatMessages, userMsg] }))

    // Simulate AI typing response
    setTimeout(() => {
      let replyText = "I'm analyzing your request. Based on the project config, it seems you want to inspect a file."
      let codeBlock: ChatMessage['codeBlock']

      if (text.toLowerCase().includes('auth') || text.toLowerCase().includes('github')) {
        replyText = "Authentication is configured via OAuth 2.0 with GitHub. The entry point API endpoint is `GET /api/v1/auth/github`. When called, it redirects users to GitHub's authorization page with configured client scopes. Callback redirects are caught at `/api/v1/auth/callback`."
        codeBlock = {
          language: 'typescript',
          code: `// Express handler example for authentication\nrouter.get('/auth/github', (req, res) => {\n  const targetUrl = \`https://github.com/login/oauth/authorize?client_id=\${process.env.GITHUB_CLIENT_ID}&redirect_uri=\${process.env.CALLBACK_URL}\`;\n  res.redirect(targetUrl);\n});`
        }
      } else if (text.toLowerCase().includes('architecture') || text.toLowerCase().includes('structure')) {
        replyText = "The architecture follows a modular client-server framework. The frontend is built on React 19 + TypeScript + Vite. The server component exposes REST APIs mapped via custom handlers. Zustand manages dashboard states. Here is the folder map:"
        codeBlock = {
          language: 'bash',
          code: `├── src/\n│   ├── assets/       # Media visual assets\n│   ├── components/   # Dashboard & Landing UI parts\n│   ├── store/        # Zustand state store\n│   ├── App.tsx       # Route coordinator\n│   └── index.css     # Global styles & HUD theme\n├── vite.config.ts    # Build configurations\n└── package.json      # Dependency map`
        }
      } else if (text.toLowerCase().includes('install') || text.toLowerCase().includes('start') || text.toLowerCase().includes('setup')) {
        replyText = "To get started locally, follow the Setup Guide checklist tab. The exact commands are:"
        codeBlock = {
          language: 'bash',
          code: `# Step 1: Install packages\nnpm install --legacy-peer-deps\n\n# Step 2: Spin database containers\ndocker-compose up -d\n\n# Step 3: Run schema migration\nnpm run db:migrate\n\n# Step 4: Run server\nnpm run dev`
        }
      } else {
        replyText = `I analyzed your query: "${text}". In the current workspace, you can find the primary logic components under \`src/components/\` and the active state machine in \`src/store/useRepoStore.ts\`. Let me know if you want me to write code snippets or explain detailed handlers.`
      }

      const aiMsg: ChatMessage = {
        id: `m_ai_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codeBlock
      }

      set(state => ({ chatMessages: [...state.chatMessages, aiMsg] }))
    }, 1200)
  },

  setSearchQueryFiles: (query: string) => set({ searchQueryFiles: query }),
  setSearchQueryApis: (query: string) => set({ searchQueryApis: query })
}))

