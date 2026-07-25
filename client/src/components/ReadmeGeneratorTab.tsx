import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Wand2, 
  Loader2, 
  Check, 
  FileCode2,
  Sparkles,
  Terminal,
  Key,
  Globe,
  Layers,
  Code2,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'
import { generateReadme } from '../lib/api'

export default function ReadmeGeneratorTab() {
  const { analysis, aiKey } = useRepoStore()
  const [readmeContent, setReadmeContent] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState<'designed' | 'raw'>('designed')

  const handleGenerate = async () => {
    if (!analysis?.meta) return
    setIsGenerating(true)
    try {
      const response = await generateReadme(analysis.meta.owner, analysis.meta.repo, aiKey || undefined)
      setReadmeContent(response.readme)
    } catch (err) {
      console.error('Failed to generate readme', err)
      setReadmeContent('# Error generating README\n\nPlease try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (readmeContent) {
      navigator.clipboard.writeText(readmeContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (readmeContent) {
      const blob = new Blob([readmeContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'README.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'POST':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      default:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    }
  }

  const repoName = analysis?.meta?.repo || 'Project'
  const projectType = analysis?.summary?.projectType || 'Software Application'
  const archType = analysis?.summary?.architectureType || 'Modular Architecture'
  const stackList = analysis?.summary?.primaryTechStack || ['Node.js', 'JavaScript']
  const entryFile = analysis?.entryPoint?.file || 'the primary entry point'
  const setupSteps = analysis?.setupSteps || []
  const envVars = analysis?.envVars || []
  const routes = analysis?.routes || []
  const apis = analysis?.apis || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono h-full flex flex-col"
    >
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-[var(--border-color)]">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-purple-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10 flex-1">
          <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            <span>DOCUMENTATION ENGINE</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans flex items-center gap-2">
            README Auto-Generator
            {aiKey && <span className="text-[10px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded uppercase border border-cyan-500/30">AI Active</span>}
          </h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl">
            Automatically synthesize comprehensive, human-written project documentation with custom interactive previews and raw Markdown exports.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg font-bold text-sm shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SYNTHESIZING...</span>
              </>
            ) : (
              <>
                <FileCode2 className="w-4 h-4" />
                <span>{readmeContent ? 'REGENERATE README' : 'GENERATE README'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 glass-panel rounded-xl border-[var(--border-color)] overflow-hidden flex flex-col relative min-h-0">
        {!readmeContent && !isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <Sparkles className="w-16 h-16 text-cyan-500/60 animate-pulse mb-2" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-sans">Ready to Generate Documentation</h3>
            <p className="text-[var(--text-secondary)] font-sans text-xs md:text-sm max-w-md">
              Click the generate button above to create a humanized README complete with Designed View and Raw Markdown modes.
            </p>
          </div>
        ) : isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            <p className="text-cyan-400 font-mono text-sm animate-pulse">
              Synthesizing architecture data and humanizing documentation...
            </p>
          </div>
        ) : (
          <>
            {/* Top Toolbar: Mode Selector & Actions */}
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0 gap-3">
              {/* View Switcher */}
              <div className="flex items-center space-x-1 bg-[var(--bg-primary)] p-1 rounded-lg border border-[var(--border-color)]">
                <button
                  onClick={() => setActiveView('designed')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold font-sans transition-all cursor-pointer ${
                    activeView === 'designed'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Designed View</span>
                </button>
                <button
                  onClick={() => setActiveView('raw')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold font-sans transition-all cursor-pointer ${
                    activeView === 'raw'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw Markdown</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[var(--bg-primary)] hover:bg-slate-800 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg transition-colors text-xs font-bold font-sans cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-cyan-400" />}
                  <span className={copied ? "text-emerald-400" : ""}>{copied ? 'COPIED!' : 'COPY'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/50 text-cyan-300 rounded-lg transition-colors text-xs font-bold font-sans cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD</span>
                </button>
              </div>
            </div>

            {/* Display Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-primary)]">
              {activeView === 'raw' ? (
                /* Raw Markdown View */
                <pre className="text-xs md:text-sm text-[var(--text-primary)] whitespace-pre-wrap font-mono leading-relaxed bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
                  {readmeContent}
                </pre>
              ) : (
                /* Beautifully Designed View (No # or * symbols) */
                <div className="space-y-8 max-w-5xl mx-auto font-sans text-left">
                  {/* 1. Project Title & Banner */}
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/30 border border-[var(--border-color)] relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-4">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{projectType}</span>
                        <span className="text-slate-600">•</span>
                        <span>{archType}</span>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 tracking-tight">
                        {repoName}
                      </h1>
                      <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-3xl border-l-4 border-cyan-500 pl-4 py-1 bg-cyan-950/20 rounded-r-lg">
                        {analysis?.summary?.oneLiner || `${repoName} is a high-performance ${projectType.toLowerCase()} built with ${stackList.join(', ')}.`}
                      </p>
                    </div>
                  </div>

                  {/* 2. About the Project Grid */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2 tracking-tight">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <span>About the Project</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* What the Repository is For */}
                      <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-2">
                        <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                          What the Repository is For
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          This repository provides the core codebase for {repoName}. It gives maintainers and developers an organized environment to build, test, and deploy software features effectively.
                        </p>
                      </div>

                      {/* What It Is */}
                      <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-purple-500/20 hover:border-purple-500/40 transition-all space-y-2">
                        <div className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
                          What It Is
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          {repoName} is structured as a {projectType.toLowerCase()} utilizing a {archType.toLowerCase()}. It combines backend logic, client interfaces, data models, and API utilities using {stackList.join(', ')}.
                        </p>
                      </div>

                      {/* How It Works */}
                      <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-blue-500/20 hover:border-blue-500/40 transition-all space-y-2">
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
                          How It Works
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          Execution initiates at <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[11px]">{entryFile}</code>. Requests pass through middleware layers for validation and routing across {routes.length || 'multiple'} mapped endpoints.
                        </p>
                      </div>

                      {/* How It Is Used */}
                      <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-2">
                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                          How It Is Used
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          Developers can clone the project, configure local environment variables, install dependencies, and launch dev or production servers as a standalone service or integrated pipeline.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Quick Start */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2 tracking-tight">
                      <Terminal className="w-5 h-5 text-emerald-400" />
                      <span>Quick Start Commands</span>
                    </h2>
                    <div className="p-5 rounded-xl bg-slate-950 border border-[var(--border-color)] space-y-3 font-mono">
                      {setupSteps.length > 0 ? (
                        setupSteps.map((step, i) => (
                          <div key={i} className="space-y-1">
                            <div className="text-xs text-slate-400 font-sans font-medium"># {step.title}</div>
                            <div className="bg-slate-900 p-3 rounded-lg text-xs text-cyan-300 font-mono border border-slate-850">
                              {step.command}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-slate-900 p-4 rounded-lg text-xs text-cyan-300 font-mono border border-slate-850 space-y-2">
                          <div className="text-slate-400 font-sans"># Install dependencies & start server</div>
                          <div>npm install</div>
                          <div>npm run dev</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Environment Variables Table */}
                  {envVars.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2 tracking-tight">
                        <Key className="w-5 h-5 text-amber-400" />
                        <span>Environment Variables</span>
                      </h2>
                      <div className="rounded-xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)] shadow-sm">
                        <table className="w-full text-left border-collapse text-xs md:text-sm">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-[var(--border-color)] text-slate-300 font-mono">
                              <th className="py-3 px-4 font-bold">Key Name</th>
                              <th className="py-3 px-4 font-bold">Required</th>
                              <th className="py-3 px-4 font-bold">Default Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-color)] font-mono">
                            {envVars.map((ev, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4 font-bold text-amber-300">{ev.name}</td>
                                <td className="py-3 px-4">
                                  {ev.required ? (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Yes</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                                      <XCircle className="w-3 h-3" />
                                      <span>No</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-400">{ev.defaultValue || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 5. API Endpoints Table */}
                  {routes.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2 tracking-tight">
                        <Layers className="w-5 h-5 text-indigo-400" />
                        <span>API Endpoints</span>
                      </h2>
                      <div className="rounded-xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)] shadow-sm">
                        <table className="w-full text-left border-collapse text-xs md:text-sm">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-[var(--border-color)] text-slate-300 font-mono">
                              <th className="py-3 px-4 font-bold">Method</th>
                              <th className="py-3 px-4 font-bold">Endpoint Path</th>
                              <th className="py-3 px-4 font-bold">Source File</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-color)] font-mono">
                            {routes.slice(0, 12).map((rt, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getMethodBadgeClass(rt.method)}`}>
                                    {rt.method}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-bold text-cyan-300">{rt.path}</td>
                                <td className="py-3 px-4 text-slate-400 text-xs">{rt.file}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {routes.length > 12 && (
                          <div className="p-3 bg-slate-900/50 text-center text-xs text-slate-400 font-sans border-t border-[var(--border-color)]">
                            +{routes.length - 12} additional endpoints configured in backend
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6. Tech Stack Taxonomy */}
                  {apis.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center space-x-2 tracking-tight">
                        <Code2 className="w-5 h-5 text-purple-400" />
                        <span>Tech Stack & Libraries</span>
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {apis.map((api, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-[var(--border-color)] text-xs font-mono text-purple-300 flex items-center space-x-1.5 shadow-sm">
                            <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">{api.category || 'Package'}:</span>
                            <span className="font-bold">{api.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
