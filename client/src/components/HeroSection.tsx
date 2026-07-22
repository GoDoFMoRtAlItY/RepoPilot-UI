import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Terminal, Cpu, ArrowRight, GitBranch } from 'lucide-react'

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
        
        {/* Orbiting Badges/Pills (RepoPilot Context) */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="relative w-full max-w-[800px] h-[500px]">
            <motion.div 
              animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[10%] left-[10%] glass-panel px-4 py-2 rounded-full text-xs font-bold tracking-widest text-[var(--text-secondary)] shadow-sm"
            >
              AST ANALYSIS
            </motion.div>
            <motion.div 
              animate={{ y: [0, 15, 0], opacity: [0.5, 1, 0.5] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[30%] right-[10%] glass-panel px-4 py-2 rounded-full text-xs font-bold tracking-widest text-[var(--text-secondary)] shadow-sm"
            >
              ARCHITECTURE GRAPH
            </motion.div>
            <motion.div 
              animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }} 
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[20%] left-[15%] glass-panel px-4 py-2 rounded-full text-xs font-bold tracking-widest text-[var(--text-secondary)] shadow-sm"
            >
              AUTO-DOCS
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }} 
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-[10%] right-[20%] glass-panel px-4 py-2 rounded-full text-[10px] font-bold tracking-widest text-rose-500/80 shadow-sm"
            >
              <GitBranch className="w-3 h-3 inline mr-1" /> API MAPPING
            </motion.div>
          </div>
        </div>

        {/* 3D Core Layer (Now provided by Global InteractiveBackground) */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" />

        {/* Side Descriptions (Left & Right) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute left-[2%] top-[40%] hidden xl:flex flex-col gap-4 max-w-[280px] pointer-events-none z-20"
        >
          <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 shadow-lg backdrop-blur-xl">
            <h3 className="font-bold text-xl mb-2 text-[var(--text-primary)] flex items-center gap-2">
              <Terminal className="w-6 h-6 text-indigo-600" /> Intelligence
            </h3>
            <p className="text-base font-medium text-[var(--text-secondary)] leading-relaxed">
              Instantly analyze complex codebases. We transform raw source code into actionable architectural insights and interactive visual graphs.
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="absolute right-[2%] top-[50%] hidden xl:flex flex-col gap-4 max-w-[280px] pointer-events-none z-20"
        >
          <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 shadow-lg backdrop-blur-xl">
            <h3 className="font-bold text-xl mb-2 text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-6 h-6 text-emerald-600" /> Automation
            </h3>
            <p className="text-base font-medium text-[var(--text-secondary)] leading-relaxed">
              Let AI do the heavy lifting. Generate documentation, map APIs, and discover tech debt seamlessly within seconds.
            </p>
          </div>
        </motion.div>

        {/* Foreground Content Layer */}
        <div className="relative z-20 flex flex-col items-center justify-end h-full w-full mt-auto pt-[450px] pb-10 pointer-events-none">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-col items-center space-y-6 w-full pointer-events-auto"
          >
            <div className="text-center space-y-4 mb-8 pointer-events-auto">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight text-[var(--text-primary)]">
              Master Your Codebase
            </h2>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-light">
              We don't just read code — we understand it.
            </p>
          </div>

            {/* GitHub Repository input box */}
            <motion.div 
              className="w-full max-w-lg glass-panel rounded-2xl p-2 md:p-3 shadow-2xl transition-colors border-[var(--border-color)]"
            >
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 relative">
                <div className="flex-1 w-full relative flex items-center">
                  <GitBranch className="absolute left-4 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="GitHub Repo URL (e.g. facebook/react)"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] font-mono outline-none transition-all"
                    disabled={isScanning}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isScanning || !repoUrl.trim()}
                  className={`w-full sm:w-auto px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-sans font-bold text-xs tracking-wider transition-all cursor-pointer shrink-0 shadow-lg ${
                    isScanning || !repoUrl.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  {scanStatus === 'detected' ? (
                    <span className="animate-pulse flex items-center justify-center gap-1.5">DETECTED</span>
                  ) : scanStatus === 'scanning' ? (
                    <span className="animate-pulse flex items-center justify-center gap-1.5">SCANNING...</span>
                  ) : scanStatus === 'ready' ? (
                    <span>READY</span>
                  ) : (
                    <span>ANALYZE</span>
                  )}
                </button>
              </form>
            </motion.div>

            <div className="flex items-center gap-6 mt-4">
              <button
                onClick={handleWatchDemo}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" /> Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
