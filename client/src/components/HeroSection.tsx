import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Terminal, ArrowRight, GitBranch, Sparkles, Network, Globe, Cpu } from 'lucide-react'

interface HeroSectionProps {
  onAnalyzeRepo: (url: string) => void
}

export default function HeroSection({ onAnalyzeRepo }: HeroSectionProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [scanStatus, setScanStatus] = useState<'idle' | 'detected' | 'scanning' | 'ready'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const triggerScanSequence = (urlToScan: string) => {
    if (scanStatus !== 'idle') return
    setScanStatus('detected')
    setTimeout(() => {
      setScanStatus('scanning')
      setTimeout(() => {
        setScanStatus('ready')
        setTimeout(() => {
          onAnalyzeRepo(urlToScan)
          setScanStatus('idle')
        }, 1200)
      }, 2000)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim()) return
    triggerScanSequence(repoUrl)
  }

  const handleWatchDemo = () => {
    setRepoUrl('https://github.com/facebook/react')
    triggerScanSequence('https://github.com/facebook/react')
  }

  const isScanning = scanStatus !== 'idle'

  const capabilityTags = [
    { label: 'AST Analysis', icon: Terminal },
    { label: 'Architecture Graph', icon: Network },
    { label: 'API Mapping', icon: Globe },
  ]

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[95vh] flex flex-col items-center justify-center pt-20 pb-12 px-4 md:px-8 overflow-hidden select-none"
    >
      {/* Massive Background Typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-30 dark:opacity-20">
        <h1 className="text-[15vw] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-transparent opacity-25 mix-blend-overlay">
          REPO
        </h1>
        <h1 className="text-[15vw] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-[var(--text-primary)] to-transparent opacity-25 mix-blend-overlay -mt-8">
          PILOT
        </h1>
      </div>

      <div className="w-full max-w-7xl relative flex flex-col items-center justify-center h-full min-h-[600px]">
        {/* Foreground Content Layer */}
        <div className="relative flex flex-col items-center justify-center w-full pointer-events-none">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col items-center space-y-6 w-full pointer-events-auto"
          >
            {/* 1. Eyebrow Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-panel px-4 py-1.5 rounded-full border border-white/60 dark:border-white/20 flex items-center gap-2 shadow-[0_0_25px_rgba(139,92,246,0.15)] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200">
                AI-powered codebase intelligence
              </span>
            </motion.div>

            {/* 2. Floating Frosted Glass Card Container with Dark Headline & Medium Grey Subtitle */}
            <div className="text-center space-y-4 pointer-events-auto glass-panel px-8 py-10 md:px-12 md:py-12 rounded-3xl mx-4 shadow-2xl backdrop-blur-3xl bg-white/80 dark:bg-white/90 border border-white/80 dark:border-white/60 max-w-3xl">
              {/* Main Headline — Dark Charcoal/Black */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0D1117] dark:text-[#0D1117] leading-tight">
                Master Your Codebase
              </h2>

              {/* Subheadline — Medium Grey Tone */}
              <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                We don't just read code — we <span className="text-[#0D1117] dark:text-[#0D1117] font-extrabold underline decoration-purple-500/40 decoration-2">understand</span> it.
              </p>
            </div>

            {/* 3. Unified Pill Input + Button */}
            <motion.div className="w-full max-w-lg">
              <form onSubmit={handleSubmit} className="relative flex items-center w-full max-w-[90vw] mx-auto glass-panel rounded-full border border-white/70 dark:border-white/30 shadow-xl overflow-hidden transition-all focus-within:border-indigo-500 focus-within:shadow-[0_0_0_4px_rgba(91,80,232,0.15)] bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl">
                <GitBranch className="absolute left-3 md:left-4 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="GitHub URL (e.g. facebook/react)"
                  className="flex-1 bg-transparent pl-9 md:pl-10 pr-2 py-3 md:py-3.5 text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 font-mono outline-none w-full font-medium"
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  disabled={isScanning || !repoUrl.trim()}
                  className={`px-4 py-2.5 md:px-6 md:py-3 mr-1 md:mr-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-sans font-extrabold text-[10px] md:text-xs tracking-wider transition-all cursor-pointer shrink-0 shadow-md ${
                    isScanning || !repoUrl.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:opacity-95 active:scale-95'
                  }`}
                >
                  {scanStatus === 'detected' ? (
                    <span className="animate-pulse flex items-center justify-center gap-1.5">DETECTED</span>
                  ) : scanStatus === 'scanning' ? (
                    <span className="animate-pulse flex items-center justify-center gap-1.5"><span className="hidden sm:inline">SCANNING...</span><span className="sm:hidden">SCAN...</span></span>
                  ) : scanStatus === 'ready' ? (
                    <span>READY</span>
                  ) : (
                    <span className="flex items-center gap-1.5">ANALYZE <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 hidden sm:block" /></span>
                  )}
                </button>
              </form>
            </motion.div>

            {/* 4. Capability Tags Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              {capabilityTags.map((tag) => (
                <div
                  key={tag.label}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/60 dark:border-white/20 bg-white/70 dark:bg-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide backdrop-blur-md shadow-sm"
                >
                  <tag.icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {tag.label}
                </div>
              ))}
            </motion.div>

            {/* 5. Watch Demo link */}
            <div className="flex items-center gap-6 mt-2">
              <button
                onClick={handleWatchDemo}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-mono text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer font-bold"
              >
                <Cpu className="w-3.5 h-3.5" /> Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
