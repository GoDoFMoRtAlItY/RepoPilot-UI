import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Loader2, AlertCircle, RefreshCw, ExternalLink, GitMerge, Sparkles, Info, FileCode } from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'
import FileTimeMachine from './FileTimeMachine'
import { getRepoEvolution, timeMachineErrorMessage, type RepoEvolutionResponse, type EvolutionMilestone } from '../lib/timeMachine'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: RepoEvolutionResponse }

const TAG_LABEL: Record<string, string> = {
  'initial-setup': 'Initial setup',
  'new-module': 'New module',
  api: 'API / routes',
  dependencies: 'Dependencies',
  architecture: 'Architecture',
  security: 'Security-related',
  'large-change': 'Large change',
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'unknown'

function MilestoneCard({ m, index, knownFiles, onOpenStory }: {
  m: EvolutionMilestone
  index: number
  knownFiles: Set<string>
  onOpenStory: (path: string) => void
}) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-[7px] top-2 w-3 h-3 rounded-full border-2 border-violet-500 bg-[var(--bg-primary)]" />
      <div className="glass-panel rounded-xl p-4 space-y-3 border border-[var(--border-color)]">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="font-bold text-violet-600 dark:text-violet-300 tracking-wider">MILESTONE {index + 1}</span>
          <span className="text-[var(--text-secondary)]">{fmtDate(m.date)} · {m.author}</span>
          {m.isMerge && <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]"><GitMerge className="w-3 h-3" /> merge</span>}
          <span className="text-[var(--text-secondary)]">
            {m.stats.filesChanged} files · <span className="text-emerald-600 dark:text-emerald-400">+{m.stats.additions}</span> <span className="text-rose-600 dark:text-rose-400">-{m.stats.deletions}</span>
            {m.stats.ignoredFiles ? <span title="Vendored dependencies, lockfiles and build output are not counted"> · {m.stats.ignoredFiles} generated/vendored files ignored</span> : null}
          </span>
          <span className="ml-auto">
            {m.source === 'gemma' ? (
              <span title="Written by Gemma from the commit evidence (inferred)" className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Sparkles className="w-2.5 h-2.5" /> Gemma{m.confidence ? ` · ${m.confidence}` : ''}
              </span>
            ) : (
              <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">Git facts</span>
            )}
          </span>
        </div>

        <h4 className="text-sm font-bold text-[var(--text-primary)] font-sans">{m.title}</h4>
        {m.explanation && <p className="text-xs leading-relaxed text-[var(--text-secondary)] font-sans">{m.explanation}</p>}
        {m.impact && <p className="text-xs font-sans text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Impact: </span>{m.impact}</p>}

        {m.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" title="Tags are derived from changed files and the commit message">
            {m.tags.map(t => (
              <span key={t} className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">{TAG_LABEL[t] || t}</span>
            ))}
          </div>
        )}

        <div className="border-t border-[var(--border-color)] pt-2.5 space-y-1">
          <div className="text-[10px] font-mono text-[var(--text-secondary)] break-words"><code>{m.shortSha}</code> “{m.message.split('\n')[0]}”</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)] pt-1">Most-changed files</div>
          {m.files.map(f => {
            const canTell = f.status !== 'removed' && knownFiles.has(f.path)
            return (
              <div key={f.path} className="flex items-center gap-2 text-[11px] font-mono">
                <FileCode className="w-3.5 h-3.5 shrink-0 text-[var(--text-secondary)]" />
                <span className="truncate text-[var(--text-primary)]" title={f.path}>{f.path}</span>
                <span className="shrink-0 text-[10px] text-[var(--text-secondary)]">{f.status}</span>
                <span className="shrink-0 text-[10px]"><span className="text-emerald-600 dark:text-emerald-400">+{f.additions}</span> <span className="text-rose-600 dark:text-rose-400">-{f.deletions}</span></span>
                {canTell && (
                  <button onClick={() => onOpenStory(f.path)} className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-300 hover:underline cursor-pointer" title="Open this file's story">
                    <History className="w-3 h-3" /> STORY
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <a href={m.commitUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-400"><ExternalLink className="w-3 h-3" /> View commit on GitHub</a>
      </div>
    </div>
  )
}

export default function TimeMachineTab() {
  const { analysis, aiKey, aiProvider } = useRepoStore()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [storyPath, setStoryPath] = useState<string | null>(null)

  const owner = analysis?.meta.owner
  const repo = analysis?.meta.repo
  const commitSha = analysis?.meta.commitSha

  useEffect(() => {
    if (!owner || !repo) return
    let cancelled = false
    getRepoEvolution({ owner, repo, ref: commitSha, refresh: reloadToken > 0, aiKey, aiProvider })
      .then(data => { if (!cancelled) setState({ status: 'done', data }) })
      .catch(err => { if (!cancelled) setState({ status: 'error', message: timeMachineErrorMessage(err) }) })
    return () => { cancelled = true }
  }, [owner, repo, commitSha, aiKey, aiProvider, reloadToken])

  const knownFiles = useMemo(() => new Set((analysis?.files || []).map(f => f.path)), [analysis?.files])

  const reload = () => {
    setState({ status: 'loading' })
    setReloadToken(t => t + 1)
  }

  if (!analysis || !owner || !repo) {
    return (
      <div className="glass-panel p-12 text-center rounded-xl text-[var(--text-secondary)] font-sans">
        Analyze a repository first to explore its history.
      </div>
    )
  }

  const evo = state.status === 'done' ? state.data.evolution : null

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 font-mono text-[var(--text-primary)] text-left">
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="text-xs text-violet-600 dark:text-violet-300 font-semibold uppercase flex items-center space-x-1.5">
            <History className="w-3.5 h-3.5" />
            <span>CODEBASE TIME MACHINE</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans">How {repo} evolved</h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl">
            The most significant moments in the repository's recent history. Dates, files and line counts come from Git; explanations come from Gemma and are marked as inferred.
          </p>
        </div>
        <button onClick={reload} disabled={state.status === 'loading'} className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-xs font-bold tracking-wider disabled:opacity-40 cursor-pointer hover:border-violet-500/40">
          <RefreshCw className={`w-3.5 h-3.5 ${state.status === 'loading' ? 'animate-spin' : ''}`} /> REBUILD
        </button>
      </div>

      {state.status === 'loading' && (
        <div className="glass-panel p-12 rounded-xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 dark:text-violet-300" />
          <p className="text-xs text-[var(--text-secondary)]">Reading recent commits and asking Gemma to connect the dots...</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="glass-panel p-8 rounded-xl flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-sm text-[var(--text-secondary)] font-sans">{state.message}</p>
          <button onClick={reload} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs font-bold cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> RETRY</button>
        </div>
      )}

      {state.status === 'done' && !evo && (
        <div className="glass-panel p-12 text-center rounded-xl text-[var(--text-secondary)] font-sans">{state.data.message}</div>
      )}

      {evo && (
        <>
          {evo.ai.status !== 'ok' && evo.ai.status !== 'partial' && (
            <div className="flex items-start gap-2 text-[11px] font-sans p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{evo.ai.status === 'not_configured' ? 'Gemma is not configured on the server, so milestones show Git facts only.' : (evo.ai.message || 'Gemma was unavailable; showing Git facts only.')}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[var(--text-secondary)]">
            <span><strong className="text-[var(--text-primary)]">{evo.window.commitsInWindow}</strong> commits examined</span>
            <span>{fmtDate(evo.window.from)} → {fmtDate(evo.window.to)}</span>
            <span><strong className="text-[var(--text-primary)]">{evo.milestones.length}</strong> milestones</span>
            {(evo.ai.status === 'ok' || evo.ai.status === 'partial') && <span className="text-violet-600 dark:text-violet-300">Explained by {evo.ai.model}</span>}
          </div>

          {evo.overview && (
            <section className="glass-panel rounded-xl p-4 space-y-2 border border-violet-500/20">
              <h3 className="text-[10px] font-bold tracking-widest text-violet-600 dark:text-violet-300">OVERVIEW</h3>
              <p className="text-sm leading-relaxed text-[var(--text-primary)] font-sans">{evo.overview.text}</p>
            </section>
          )}

          <div className="relative space-y-4 before:absolute before:left-[12px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--border-color)]">
            {evo.milestones.map((m, i) => (
              <MilestoneCard key={m.sha} m={m} index={i} knownFiles={knownFiles} onOpenStory={setStoryPath} />
            ))}
          </div>

          {(evo.gaps.length > 0 || evo.notes.length > 0 || evo.uncertainties.length > 0) && (
            <section className="rounded-xl p-4 space-y-1.5 border border-amber-500/25 bg-amber-500/5">
              <h3 className="text-[10px] font-bold tracking-widest text-amber-700 dark:text-amber-300">LIMITS OF THIS TIMELINE</h3>
              {[...evo.gaps, ...evo.notes, ...evo.uncertainties].map((g, i) => (
                <p key={i} className="text-xs font-sans text-[var(--text-secondary)]">• {g}</p>
              ))}
            </section>
          )}

          <footer className="text-[10px] text-[var(--text-secondary)] flex flex-wrap gap-x-4">
            <span>GitHub calls: {state.status === 'done' ? state.data.meta.apiCalls.github : 0} (+{state.status === 'done' ? state.data.meta.apiCalls.githubCached : 0} cached)</span>
            <span>Gemma calls: {state.status === 'done' ? state.data.meta.apiCalls.ai ?? 0 : 0}</span>
            <span>{state.status === 'done' && state.data.meta.cache === 'hit' ? 'Served from cache' : 'Freshly generated'}</span>
          </footer>
        </>
      )}

      <AnimatePresence>
        {storyPath && (
          <FileTimeMachine key={storyPath} owner={owner} repo={repo} path={storyPath} refSha={commitSha} onClose={() => setStoryPath(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
