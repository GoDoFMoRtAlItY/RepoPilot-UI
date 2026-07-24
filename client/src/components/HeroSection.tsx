import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Terminal, ArrowRight, GitBranch, Sparkles, Network, Globe, Cpu } from 'lucide-react'

interface HeroSectionProps {
  onAnalyzeRepo: (url: string) => void
}

export default function HeroSection({ onAnalyzeRepo }: HeroSectionProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [scanStatus, setScanStatus] = useState<'idle' | 'detected' | 'scanning' | 'ready'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Framer Motion values for cursor tracking (for the spotlight)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 30, stiffness: 100, mass: 0.6 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  const spotlightBg = useTransform(
    [smoothX, smoothY],
    ([x, y]) => `radial-gradient(380px circle at ${x}px ${y}px, var(--glass-hover-bg) 0%, transparent 100%)`
  )

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        mouseX.set(rect.width / 2)
        mouseY.set(rect.height / 2)
      }
    }
    const timer = setTimeout(handleResize, 100)
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [mouseX, mouseY])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }
  const handleMouseLeave = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(rect.width / 2)
    mouseY.set(rect.height / 2)
  }

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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[95vh] flex flex-col items-center justify-center pt-20 pb-12 px-4 md:px-8 overflow-hidden select-none"
    >
      {/* Cursor spotlight effects */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-15 mix-blend-overlay opacity-30 dark:opacity-100"
        style={{ background: spotlightBg }}
      />

      {/* Massive Background Typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-40 dark:opacity-20">
        <h1 className="text-[15vw] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-primary)] to-transparent opacity-30 mix-blend-overlay">
          REPO
        </h1>
        <h1 className="text-[15vw] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-[var(--text-primary)] to-transparent opacity-30 mix-blend-overlay -mt-8">
          PILOT
        </h1>
      </div>

      <div className="w-full max-w-7xl relative z-10 flex flex-col items-center justify-center h-full min-h-[600px]">
        
        {/* 3D Core Layer (Now provided by Global InteractiveBackground) */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" />

        {/* Foreground Content Layer — Single Centered Vertical Column */}
        <div className="relative z-20 flex flex-col items-center justify-center w-full pointer-events-none">
          
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
              <span className="text-xs font-medium tracking-wide text-white/90 dark:text-white/90 light:text-[var(--text-primary)]">
                AI-powered codebase intelligence
              </span>
            </motion.div>

            {/* 2. Main Headline */}
            <div className="text-center space-y-4 pointer-events-auto">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-[var(--text-primary)]">
                Master Your Codebase
              </h2>

              {/* 3. Subheadline — high contrast */}
              <p className="text-lg md:text-xl text-slate-300 dark:text-slate-300 max-w-2xl mx-auto font-light">
                We don't just read code — we <span className="text-white font-medium">understand</span> it.
              </p>
            </div>

            {/* 4. Unified Pill Input + Button */}
            <motion.div 
              className="w-full max-w-lg"
            >
              <form onSubmit={handleSubmit} className="relative flex items-center w-full glass-panel rounded-full border border-[var(--border-color)] shadow-2xl shadow-black/30 overflow-hidden transition-all focus-within:border-[var(--accent-primary)]/60 focus-within:shadow-[0_0_24px_rgba(59,130,246,0.15)]">
                <GitBranch className="absolute left-4 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="GitHub Repo URL (e.g. facebook/react)"
                  className="flex-1 bg-transparent pl-10 pr-2 py-3.5 text-sm text-[var(--text-primary)] placeholder-slate-500 dark:placeholder-slate-500 font-mono outline-none"
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  disabled={isScanning || !repoUrl.trim()}
                  className={`px-5 py-2.5 mr-1.5 bg-[var(--accent-primary)] text-white rounded-full font-sans font-bold text-xs tracking-wider transition-all cursor-pointer shrink-0 shadow-lg ${
                    isScanning || !repoUrl.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-[0_0_16px_rgba(59,130,246,0.4)] active:scale-95'
                  }`}
                >
                  {scanStatus === 'detected' ? (
                    <span className="animate-pulse flex items-center justify-center gap-1.5">DETECTED</span>
                  ) : scanStatus === 'scanning' ? (
                    <span className="animate-pulse flex items-center justify-center gap-1.5">SCANNING...</span>
                  ) : scanStatus === 'ready' ? (
                    <span>READY</span>
                  ) : (
                    <span className="flex items-center gap-1.5">ANALYZE <ArrowRight className="w-3.5 h-3.5" /></span>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 dark:border-white/10 bg-white/[0.03] dark:bg-white/[0.03] text-xs font-medium text-slate-300 dark:text-slate-300 tracking-wide"
                >
                  <tag.icon className="w-3 h-3 text-cyan-400" />
                  {tag.label}
                </div>
              ))}
            </motion.div>

            {/* 6. Watch Demo link */}
            <div className="flex items-center gap-6 mt-2">
              <button
                onClick={handleWatchDemo}
                className="text-slate-400 dark:text-slate-400 hover:text-white dark:hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
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
