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
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-40 dark:opacity-20">
        <h1 className="text-[15vw] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-transparent opacity-30 mix-blend-overlay">
          REPO
        </h1>
        <h1 className="text-[15vw] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-[var(--text-primary)] to-transparent opacity-30 mix-blend-overlay -mt-8">
          PILOT
        </h1>
      </div>

      <div className="w-full max-w-7xl relative flex flex-col items-center justify-center h-full min-h-[600px]">
        
        {/* 3D Core Layer (Now provided by Global InteractiveBackground) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" />

        {/* Foreground Content Layer — Single Centered Vertical Column */}
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
              className="glass-panel px-4 py-1.5 rounded-full border border-[var(--border-color)] flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-medium tracking-wide text-[var(--text-primary)]">
                AI-powered codebase intelligence
              </span>
            </motion.div>

            {/* 2. Main Headline */}
            <div className="text-center space-y-4 pointer-events-auto glass-panel px-8 py-8 rounded-3xl mx-4 shadow-2xl">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-[var(--text-primary)]">
                Master Your Codebase
              </h2>

              {/* 3. Subheadline — high contrast */}
              <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-light">
                We don't just read code — we <span className="text-[var(--text-primary)] font-medium">understand</span> it.
              </p>
            </div>

            {/* 4. Unified Pill Input + Button */}
            <motion.div 
              className="w-full max-w-lg"
            >
              <form onSubmit={handleSubmit} className="relative flex items-center w-full max-w-[90vw] mx-auto glass-panel rounded-full border border-[var(--border-color)] shadow-lg overflow-hidden transition-all focus-within:border-[var(--accent-primary)]/60 focus-within:shadow-[0_0_0_3px_rgba(91,80,232,0.12)]">
                <GitBranch className="absolute left-3 md:left-4 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="GitHub URL (e.g. facebook/react)"
                  className="flex-1 bg-transparent pl-9 md:pl-10 pr-2 py-3 md:py-3.5 text-xs md:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] font-mono outline-none w-full"
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  disabled={isScanning || !repoUrl.trim()}
                  className={`px-3 py-2 md:px-5 md:py-2.5 mr-1 md:mr-1.5 bg-[var(--accent-primary)] text-white rounded-full font-sans font-bold text-[10px] md:text-xs tracking-wider transition-all cursor-pointer shrink-0 ${
                    isScanning || !repoUrl.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:opacity-90 active:scale-95'
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

            {/* 5. Capability Tags Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              {capabilityTags.map((tag) => (
                <div
                  key={tag.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--glass-bg)] text-xs font-medium text-[var(--text-secondary)] tracking-wide"
                >
                  <tag.icon className="w-3 h-3 text-[var(--accent-primary)]" />
                  {tag.label}
                </div>
              ))}
            </motion.div>

            {/* 6. Watch Demo link */}
            <div className="flex items-center gap-6 mt-2">
              <button
                onClick={handleWatchDemo}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
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
