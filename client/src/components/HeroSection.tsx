import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Terminal, Cpu, ArrowRight, GitBranch, Database, ShieldCheck, ListTodo, Check } from 'lucide-react'
import HologramRobot from './HologramRobot'

interface HeroSectionProps {
  onAnalyzeRepo: (url: string) => void
}

export default function HeroSection({ onAnalyzeRepo }: HeroSectionProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [scanStatus, setScanStatus] = useState<'idle' | 'detected' | 'scanning' | 'ready'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Framer Motion values for cursor tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring configuration for smooth cinematic delay
  const springConfig = { damping: 30, stiffness: 100, mass: 0.6 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Dynamic radial-gradients for the inspection torch spotlight and dark vignette
  const spotlightBg = useTransform(
    [smoothX, smoothY],
    ([x, y]) => `radial-gradient(380px circle at ${x}px ${y}px, rgba(34, 211, 238, 0.15) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)`
  )

  const vignetteBg = useTransform(
    [smoothX, smoothY],
    ([x, y]) => `radial-gradient(650px circle at ${x}px ${y}px, transparent 20%, rgba(5, 7, 10, 0.45) 55%, rgba(5, 7, 10, 0.78) 100%)`
  )

  // Initialize position to the center of the hero section on mount
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        mouseX.set(rect.width / 2)
        mouseY.set(rect.height / 2)
      }
    }
    
    // Delay slightly to ensure client dimensions are ready
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

    // Phase 1: Detected
    setScanStatus('detected')
    
    // Phase 2: Scanning (after 1s)
    setTimeout(() => {
      setScanStatus('scanning')
      
      // Phase 3: Ready (after 2s)
      setTimeout(() => {
        setScanStatus('ready')
        
        // Phase 4: Launch dashboard (after 1.2s)
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

  const handlePrimaryCta = () => {
    if (repoUrl.trim()) {
      triggerScanSequence(repoUrl)
    } else {
      inputRef.current?.focus()
    }
  }

  // Floating HUD panel specifications
  const hudPanels = [
    { 
      title: 'Repository Ingestion', 
      value: '97% COMPLETED', 
      icon: Database, 
      pos: 'top-10 -left-6 md:-left-12',
      color: 'border-cyan-500/30 text-cyan-400',
      delay: 0.6
    },
    { 
      title: 'Architecture Schema', 
      value: 'MAPPED', 
      icon: Cpu, 
      pos: 'top-1/3 -right-6 md:-right-12',
      color: 'border-purple-500/30 text-purple-400',
      delay: 0.8
    },
    { 
      title: 'Docker Sandbox', 
      value: 'ACTIVE', 
      icon: ShieldCheck, 
      pos: 'bottom-20 -left-4 md:-left-8',
      color: 'border-blue-500/30 text-blue-400',
      delay: 1.0
    },
    { 
      title: 'Setup Checklist', 
      value: '6 STEPS LOADED', 
      icon: ListTodo, 
      pos: 'bottom-6 -right-4 md:-right-8',
      color: 'border-green-500/30 text-green-400',
      delay: 1.2
    }
  ]

  const isScanning = scanStatus !== 'idle'

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[95vh] flex flex-col items-center justify-center pt-24 pb-12 px-4 md:px-8 overflow-hidden grid-bg select-none"
    >
      {/* Cursor spotlight effects (inspection torch) */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{ background: vignetteBg }}
      />
      <motion.div 
        className="absolute inset-0 pointer-events-none z-15"
        style={{ 
          background: spotlightBg,
          mixBlendMode: 'screen'
        }}
      />

      {/* Background neon flares */}
      <div className="absolute top-[25%] left-[50%] -translate-x-[50%] w-[70%] h-[320px] bg-gradient-to-r from-blue-500/10 via-cyan-500/15 to-purple-500/10 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute inset-0 scanlines opacity-25 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Content & Headline */}
        <div className="lg:col-span-7 flex flex-col text-left space-y-6 order-2 lg:order-1">
          {/* Top AI tag */}
          <motion.div 
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider text-cyan-400 w-fit shadow-[0_0_10px_rgba(34,211,238,0.15)]"
          >
            <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>AI CO-PILOT EXPERT TECHNICAL MENTOR</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-sans"
          >
            Understand Any GitHub <br />
            Repository{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent text-glow-cyan">
              in Minutes.
            </span>
          </motion.h1>

          {/* Text Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-slate-300 text-sm md:text-base max-w-xl font-sans leading-relaxed"
          >
            RepoPilot analyzes repositories, explains project architecture, guides setup, highlights important files, and answers repository-specific questions through an intelligent AI assistant.
          </motion.p>

          {/* Action buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
          >
            <button
              onClick={handlePrimaryCta}
              className="group relative px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-white font-mono font-semibold tracking-wider text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] active:scale-95"
            >
              <span>ANALYZE REPOSITORY</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={handleWatchDemo}
              className="px-6 py-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-slate-400 hover:text-white font-mono tracking-wider text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>WATCH DEMO</span>
            </button>
          </motion.div>

          {/* Value Propositions checklist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg font-mono text-[10px] text-slate-400 border-t border-slate-900/60 pt-5"
          >
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Repository Understanding</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Guided Setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Architecture Mapping</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>AI Assistant</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Robot Showcase, HUD panels, and Input Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center order-1 lg:order-2 relative">
          
          {/* Hologram robot container surrounded by floating HUD nodes */}
          <div className="relative w-full max-w-[400px] h-[360px] md:h-[420px] flex items-center justify-center">
            
            {/* Hologram robot canvas centerpiece */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full relative z-10"
            >
              <HologramRobot scanStatus={scanStatus} repoUrl={repoUrl} />
            </motion.div>

            {/* Absolute positioned HUD Panels */}
            {hudPanels.map((panel, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 0.6, delay: panel.delay }}
                whileHover={{ opacity: 1, scale: 1.03, transition: { duration: 0.2 } }}
                className={`absolute ${panel.pos} z-20 glass-panel p-2.5 rounded-lg border flex items-center space-x-2.5 shadow-2xl pointer-events-auto bg-[#0B1220]/95 min-w-[140px] text-left cursor-default ${panel.color}`}
              >
                <div className="p-1 rounded bg-slate-950 border border-slate-800">
                  <panel.icon className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">{panel.title}</span>
                  <span className="text-[9px] font-sans font-bold text-white tracking-wide">{panel.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* GitHub Repository input box placed directly beneath the robot */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="w-full max-w-md bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 shadow-2xl relative z-20 hover:border-cyan-500/30 transition-colors"
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-900 pb-2">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">INGEST WORKSPACE URL</span>
              </div>
              <div className="flex items-center gap-2 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Paste GitHub Repository URL (e.g. facebook/react)"
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 font-mono outline-none transition-all"
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  disabled={isScanning || !repoUrl.trim()}
                  className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg text-white font-mono text-xs font-bold tracking-wider transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isScanning || !repoUrl.trim() ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {scanStatus === 'detected' ? (
                    <span className="animate-pulse flex items-center gap-1.5">
                      DETECTED
                    </span>
                  ) : scanStatus === 'scanning' ? (
                    <span className="animate-pulse flex items-center gap-1.5">
                      SCANNING...
                    </span>
                  ) : scanStatus === 'ready' ? (
                    <span>READY</span>
                  ) : (
                    <span>ANALYZE</span>
                  )}
                </button>
              </div>
            </form>

            {/* Radar scanner pulse when loading */}
            {isScanning && (
              <div className="absolute inset-0 border border-cyan-400 rounded-xl pointer-events-none animate-radar-pulse opacity-60" />
            )}
          </motion.div>
        </div>

      </div>
    </section>
  )
}
