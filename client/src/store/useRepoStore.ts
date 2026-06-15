import { create } from 'zustand'
import { analyzeRepository, askAiQuestion } from '../lib/api'

// -- API Types (matching backend schema) --
export interface RepoAnalysis {
  meta: {
    owner: string
    repo: string
    defaultBranch: string
    description: string
    language: string
    stars: number
    analyzedAt: string
    commitSha: string
  }
  summary: {
    totalFiles: number
    analyzedFiles: number
    projectType: string
    oneLiner: string
  }
  entryPoint: {
    file: string
    line: number
    confidence: string
    reason: string
    githubUrl: string
  }
  setupSteps: {
    order: number
    title: string
    command: string
    description: string
    note: string | null
  }[]
  envVars: {
    name: string
    file: string
    line: number
    defaultValue: string | null
    required: boolean
    githubUrl: string
  }[]
  routes: {
    method: string
    path: string
    file: string
    line: number
    usesEnvVars: string[]
    usesApis: string[]
    githubUrl: string
  }[]
  apis: {
    name: string
    package: string
    importFile: string
    importLine: number
    category: string
    githubUrl: string
  }[]
  fileRoles: {
    file: string
    role: string
    size: number
    githubUrl: string
  }[]
  graph: {
    nodes: { id: string, type: string, label: string, file: string, line: number, githubUrl: string }[]
    edges: { id: string, source: string, target: string, label: string }[]
  }
  onboardingScore: {
    score: number
    breakdown: { check: string, passed: boolean, points: number, detail: string }[]
  }
  securityAlerts: {
    severity: string
    type: string
    message: string
    file: string
    line: number
    githubUrl: string
  }[]
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  citations?: { file: string, line: number, githubUrl: string }[]
  mode?: 'advanced' | 'basic'
}

interface RepoStore {
  // State
  currentTab: string
  analyzedRepo: string | null
  isAnalyzing: boolean
  error: string | null
  analysis: RepoAnalysis | null
  chatMessages: ChatMessage[]
  searchQueryFiles: string
  searchQueryApis: string
  aiKey: string | null
  
  // Actions
  setCurrentTab: (tab: string) => void
  setAiKey: (key: string) => void
  setSearchQueryFiles: (query: string) => void
  setSearchQueryApis: (query: string) => void
  analyzeRepo: (owner: string, repo: string, force?: boolean) => Promise<void>
  sendChatMessage: (text: string) => Promise<void>
}

export const useRepoStore = create<RepoStore>((set, get) => ({
  currentTab: 'Overview',
  analyzedRepo: null,
  isAnalyzing: false,
  error: null,
  analysis: null,
  chatMessages: [
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your RepoPilot Onboarding Assistant. Paste a GitHub repository URL above to get started.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  searchQueryFiles: '',
  searchQueryApis: '',
  aiKey: sessionStorage.getItem('repopilot_ai_key') || null,

  setCurrentTab: (tab: string) => set({ currentTab: tab }),
  
  setAiKey: (key: string) => {
    sessionStorage.setItem('repopilot_ai_key', key)
    set({ aiKey: key })
  },
  
  setSearchQueryFiles: (query: string) => set({ searchQueryFiles: query }),
  
  setSearchQueryApis: (query: string) => set({ searchQueryApis: query }),
  
  analyzeRepo: async (owner: string, repo: string, force = false) => {
    set({ 
      analyzedRepo: `${owner}/${repo}`, 
      isAnalyzing: true, 
      error: null,
      analysis: null,
      chatMessages: [
        {
          id: 'welcome2',
          sender: 'assistant',
          text: `Analyzing ${owner}/${repo}... this might take a few seconds depending on the repository size.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    })
    
    try {
      const data = await analyzeRepository(owner, repo, force)
      set({ 
        analysis: data, 
        isAnalyzing: false,
        chatMessages: [
          {
            id: `success-${Date.now()}`,
            sender: 'assistant',
            text: `Successfully analyzed **${owner}/${repo}**! I've extracted ${data.routes.length} routes, ${data.envVars.length} environment variables, and ${data.apis.length} API dependencies.\n\nWhat would you like to know about this repository?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      })
    } catch (error: any) {
      set({ 
        isAnalyzing: false, 
        error: error?.response?.data?.error || 'Failed to analyze repository',
        chatMessages: [
          {
            id: `error-${Date.now()}`,
            sender: 'assistant',
            text: `Error analyzing repository: ${error?.response?.data?.error || error.message}. Please make sure the repository is public.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      })
    }
  },

  sendChatMessage: async (text: string) => {
    const { analyzedRepo, aiKey } = get()
    
    if (!analyzedRepo) return

    const [owner, repo] = analyzedRepo.split('/')

    const userMsg: ChatMessage = {
      id: `m_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    set(state => ({ chatMessages: [...state.chatMessages, userMsg] }))

    try {
      const response = await askAiQuestion(owner, repo, text, aiKey || undefined)
      
      const aiMsg: ChatMessage = {
        id: `m_ai_${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
        mode: response.mode
      }

      set(state => ({ chatMessages: [...state.chatMessages, aiMsg] }))
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `m_ai_err_${Date.now()}`,
        sender: 'assistant',
        text: `Error contacting AI service: ${error.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      set(state => ({ chatMessages: [...state.chatMessages, errorMsg] }))
    }
  }
}))
