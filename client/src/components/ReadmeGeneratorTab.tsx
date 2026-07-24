import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Wand2, 
  Loader2, 
  Check, 
  FileCode2,
  Eye,
  Code
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRepoStore } from '../store/useRepoStore'
import { generateReadme } from '../lib/api'

export default function ReadmeGeneratorTab() {
  const { analysis, aiKey } = useRepoStore()
  const [readmeContent, setReadmeContent] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')

  const handleGenerate = async () => {
    if (!analysis?.meta) return
    setIsGenerating(true)
    try {
      const response = await generateReadme(analysis.meta.owner, analysis.meta.repo, aiKey || undefined, analysis)
      setReadmeContent(response.readme)
    } catch (err) {
      console.error('Failed to generate readme', err)
      setReadmeContent('Error generating README. Please try again.')
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono h-full flex flex-col"
    >
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10 flex-1">
          <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI GENERATOR</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans flex items-center gap-2">
            README.md Auto-Generator
            {aiKey && <span className="text-[10px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded uppercase border border-cyan-500/30">Gemini Powered</span>}
          </h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl">
            Automatically generate a clean, human-written README based on the static analysis of your architecture, routes, APIs, and environment variables.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-[var(--text-primary)] rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>GENERATING...</span>
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

      {/* Content Area */}
      <div className="flex-1 glass-panel rounded-xl border-[var(--border-color)] overflow-hidden flex flex-col relative min-h-0">
        {!readmeContent && !isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50 space-y-4">
            <FileText className="w-16 h-16 text-[var(--text-secondary)] mb-2" />
            <p className="text-[var(--text-secondary)] font-sans max-w-md">
              Click the generate button above to create a markdown README using the repository's analysis data.
            </p>
          </div>
        ) : isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-cyan-600 dark:text-cyan-400 animate-spin" />
            <p className="text-cyan-600 dark:text-cyan-400 font-mono text-sm animate-pulse">
              Synthesizing architecture data into markdown...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">README.md</span>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-[var(--bg-primary)] p-0.5 rounded-lg border border-[var(--border-color)] text-[10px]">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                      viewMode === 'preview' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>PREVIEW</span>
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                      viewMode === 'raw' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>RAW MARKDOWN</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-slate-700 text-[var(--text-primary)] rounded transition-colors text-[10px] uppercase font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <FileText className="w-3.5 h-3.5" />}
                  <span className={copied ? "text-green-400" : ""}>{copied ? 'COPIED!' : 'COPY'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-slate-700 text-[var(--text-primary)] rounded transition-colors text-[10px] uppercase font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--surface-sunken,var(--bg-secondary))]">
              {viewMode === 'preview' ? (
                <div className="max-w-4xl mx-auto space-y-4 font-sans text-[var(--text-primary)] text-sm leading-relaxed text-left">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 mt-4 mb-3 font-sans tracking-tight">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold text-cyan-600 dark:text-cyan-300 border-b border-[var(--border-color)] pb-1.5 mt-6 mb-3 font-sans tracking-tight">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold text-[var(--text-primary)] mt-4 mb-2 font-sans">{children}</h3>,
                      p: ({ children }) => <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] text-sm mb-4 ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-[var(--text-secondary)] text-sm mb-4 ml-2">{children}</ol>,
                      li: ({ children }) => <li className="text-[var(--text-secondary)] text-sm leading-relaxed">{children}</li>,
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        if (match || String(children).includes('\n')) {
                          return (
                            <pre className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 font-mono text-xs text-cyan-600 dark:text-cyan-300 overflow-x-auto my-4">
                              <code>{children}</code>
                            </pre>
                          )
                        }
                        return (
                          <code className="px-1.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-cyan-600 dark:text-cyan-400 text-xs font-mono" {...props}>
                            {children}
                          </code>
                        )
                      },
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-lg border border-[var(--border-color)]">
                          <table className="w-full text-xs font-mono">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold">{children}</thead>,
                      th: ({ children }) => <th className="px-3.5 py-2.5 text-left border-b border-[var(--border-color)]">{children}</th>,
                      td: ({ children }) => <td className="px-3.5 py-2 border-b border-[var(--border-color)] text-[var(--text-secondary)]">{children}</td>,
                    }}
                  >
                    {readmeContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="text-xs md:text-sm text-[var(--text-primary)] whitespace-pre-wrap font-mono leading-relaxed max-w-4xl mx-auto">
                  {readmeContent}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
