import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Wand2, 
  Loader2, 
  Check, 
  FileCode2 
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'
import { generateReadme } from '../lib/api'

export default function ReadmeGeneratorTab() {
  const { analysis, aiKey } = useRepoStore()
  const [readmeContent, setReadmeContent] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

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
            Automatically generate a comprehensive, professional README based on the static analysis of your architecture, routes, APIs, and environment variables.
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
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold text-[var(--text-primary)]">README.md</span>
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
            <div className="flex-1 overflow-y-auto p-6 bg-[#0B1220]/80">
              <pre className="text-xs md:text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans leading-relaxed">
                {readmeContent}
              </pre>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
