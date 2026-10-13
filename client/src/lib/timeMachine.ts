import axios from 'axios'
import { API_BASE_URL } from './api'

// ---------- Types (mirror server/src/services/history/*) ----------

export type Source = 'gemma' | 'git'
export type AiStatus = 'ok' | 'partial' | 'invalid' | 'unavailable' | 'not_configured' | 'not_called'

export interface StructuralFacts {
  addedImports: string[]
  removedImports: string[]
  addedSymbols: string[]
  removedSymbols: string[]
  modifiedSymbols: string[]
  addedExports: string[]
  removedExports: string[]
  addedRoutes: string[]
  removedRoutes: string[]
  linesAdded: number
  linesRemoved: number
}

export interface PatchExcerpt {
  excerpt: string | null
  truncated: boolean
  available: boolean
  totalLines: number
}

export interface FileStructure {
  imports: string[]
  exports: string[]
  functions: number
  classes: number
  routeCount: number
  linesOfCode: number
}

export interface StoryChapter {
  ref: string
  sha: string
  shortSha: string
  date: string
  author: string
  message: string
  kind: string
  path: string
  renamedFrom: string | null
  stats: { additions: number; deletions: number } | null
  facts: StructuralFacts
  patch: PatchExcerpt
  commitUrl: string
  blobUrl: string
  title: string
  explanation: string
  reasonForChange: string | null
  reasonBasis: 'commit_message' | 'diff' | 'code' | 'unknown'
  impact: string | null
  confidence: 'high' | 'medium' | 'low' | null
  source: Source
}

export interface TimelineEntry {
  sha: string
  shortSha: string
  date: string
  author: string
  title: string
  path: string
  commitUrl: string
  isMilestone: boolean
  ref: string | null
  kind: string | null
  stats: { additions: number; deletions: number } | null
}

export interface AiInfo {
  status: AiStatus
  backend: string | null
  model: string | null
  message: string | null
  issues: string[]
}

export interface FileStory {
  file: { path: string; language: string; state: 'active' | 'deleted' | 'unreadable'; pathHistory: string[] }
  summary: { text: string; source: Source }
  origin: {
    sha: string
    shortSha: string
    date: string
    author: string
    message: string
    path: string
    confirmed: boolean
    commitUrl: string
    blobUrl: string | null
    structure: FileStructure | null
    explanation: string | null
    basis: string
    source: Source
  }
  chapters: StoryChapter[]
  architecturalEvolution: { text: string; source: Source } | null
  currentState: {
    structure: FileStructure | null
    explanation: string | null
    lingeringInfluences: { ref: string; sha: string; note: string }[]
    source: Source
  }
  comparison: {
    origin: FileStructure
    current: FileStructure
    importsAdded: string[]
    importsRemoved: string[]
    exportsAdded: string[]
    exportsRemoved: string[]
  } | null
  timeline: TimelineEntry[]
  history: {
    commitCount: number
    truncated: boolean
    originConfirmed: boolean
    renames: { sha: string; shortSha: string; date: string; from: string; to: string }[]
    detailedCommits: number
    gaps: string[]
  }
  uncertainties: string[]
  ai: AiInfo
  generatedAt: string
}

export interface ApiCallMeta {
  apiCalls: { github: number; githubCached: number; ai?: number }
  cache: 'hit' | 'miss'
  analysisVersion?: string
}

export interface FileStoryResponse {
  status: 'ok' | 'no_history'
  story: FileStory | null
  message?: string
  meta: ApiCallMeta
}

export interface CommitFileDiff {
  sha: string
  message: string
  date: string
  author: string
  commitUrl: string
  filesChanged: number
  file: {
    path: string
    previousPath: string | null
    status: string
    additions: number
    deletions: number
    facts: StructuralFacts
    patch: PatchExcerpt
  } | null
}

export interface EvolutionMilestone {
  ref: string
  sha: string
  shortSha: string
  date: string
  author: string
  message: string
  title: string
  explanation: string | null
  impact: string | null
  confidence: 'high' | 'medium' | 'low' | null
  source: Source
  tags: string[]
  isMerge: boolean
  stats: { additions: number; deletions: number; filesChanged: number; ignoredFiles?: number }
  files: { path: string; status: string; additions: number; deletions: number; previousPath: string | null; blobUrl: string | null }[]
  commitUrl: string
}

export interface RepoEvolution {
  repository: { owner: string; repo: string; defaultBranch: string | null }
  window: { commitsInWindow: number; truncated: boolean; from: string; to: string; detailedCommits: number }
  overview: { text: string; source: Source } | null
  milestones: EvolutionMilestone[]
  gaps: string[]
  notes: string[]
  uncertainties: string[]
  ai: AiInfo
  generatedAt: string
}

export interface RepoEvolutionResponse {
  status: 'ok' | 'no_history'
  evolution: RepoEvolution | null
  message?: string
  meta: ApiCallMeta
}

// ---------- API ----------

function aiHeaders(aiKey?: string | null, aiProvider?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (aiKey) headers['X-AI-Key'] = aiKey
  if (aiProvider) headers['X-AI-Provider'] = aiProvider
  return headers
}

export async function getFileStory(params: {
  owner: string
  repo: string
  path: string
  ref?: string
  refresh?: boolean
  aiKey?: string | null
  aiProvider?: string | null
}): Promise<FileStoryResponse> {
  const { owner, repo, path, ref, refresh, aiKey, aiProvider } = params
  const response = await axios.post(
    `${API_BASE_URL}/time-machine/file-story`,
    { owner, repo, path, ref, refresh: Boolean(refresh) },
    { headers: aiHeaders(aiKey, aiProvider), timeout: 180000 }
  )
  return response.data
}

export async function getCommitFileDiff(owner: string, repo: string, sha: string, path: string): Promise<CommitFileDiff> {
  const response = await axios.get(
    `${API_BASE_URL}/time-machine/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commit/${sha}`,
    { params: { path }, timeout: 60000 }
  )
  return response.data
}

export async function getRepoEvolution(params: {
  owner: string
  repo: string
  ref?: string
  refresh?: boolean
  aiKey?: string | null
  aiProvider?: string | null
}): Promise<RepoEvolutionResponse> {
  const { owner, repo, ref, refresh, aiKey, aiProvider } = params
  const response = await axios.post(
    `${API_BASE_URL}/time-machine/repo-evolution`,
    { owner, repo, ref, refresh: Boolean(refresh) },
    { headers: aiHeaders(aiKey, aiProvider), timeout: 180000 }
  )
  return response.data
}

/** Pull a readable message out of an axios error from the Time Machine routes. */
export function timeMachineErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; resetAt?: string } | undefined
    if (data?.error) {
      return data.resetAt ? `${data.error} (resets at ${new Date(data.resetAt).toLocaleTimeString()})` : data.error
    }
    if (err.code === 'ECONNABORTED') return 'The request took too long. Large histories can take a minute; please retry.'
    if (!err.response) return 'Could not reach the RepoPilot server.'
  }
  return 'Something went wrong while loading history.'
}
