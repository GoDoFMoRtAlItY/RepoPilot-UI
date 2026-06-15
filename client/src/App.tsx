import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRepoStore } from './store/useRepoStore'
import HeroSection from './components/HeroSection'
import FeatureShowcase from './components/FeatureShowcase'
import AiPreviewSection from './components/AiPreviewSection'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import OverviewTab from './components/OverviewTab'
import SetupGuideTab from './components/SetupGuideTab'
import ImportantFilesTab from './components/ImportantFilesTab'
import ArchitectureTab from './components/ArchitectureTab'
import ApiRoutesTab from './components/ApiRoutesTab'
import EnvVariablesTab from './components/EnvVariablesTab'
import AiAssistantTab from './components/AiAssistantTab'
import { Compass, Terminal, ShieldAlert } from 'lucide-react'
import Lenis from 'lenis'

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [booting, setBooting] = useState(true)
  const [bootLogs, setBootLogs] = useState<string[]>([])
  
  const { currentTab, setCurrentTab, setAnalyzedRepo } = useRepoStore()

  // 1. Lenis smooth scrolling integration
  useEffect(() => {
    if (viewMode === 'landing') {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        gestureOrientation: 'vertical',
        smoothWheel: true,
      })

      const raf = (time: number) => {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)

      return () => {
        lenis.destroy()
      }
    }
  }, [viewMode])

  // 2. Cinematic boot sequence simulator
  useEffect(() => {
    const logs = [
      'Initializing RepoPilot core context pipeline...',
      'Mapping Abstract Syntax Tree (AST) parser units...',
      'Exposing database schema indexes...',
      'Ingesting sandbox environmental specifications...',
      'Syncing AI Technical Onboarding Mentor...',
      'Hologram projection materialized. System ACTIVE.'
    ]

    let currentLogIndex = 0
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setBootLogs((prev) => [...prev, logs[currentLogIndex]])
        currentLogIndex++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setBooting(false)
        }, 600)
      }
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const handleLaunchDashboard = () => {
    setViewMode('dashboard')
  }

  const handleBackToLanding = () => {
    setViewMode('landing')
  }

  const handleAnalyzeRepoUrl = (url: string) => {
    // Parse name out of URL if possible
    let repoName = url.trim()
    if (repoName.startsWith('https://github.com/')) {
      repoName = repoName.replace('https://github.com/', '')
    }
    if (repoName.endsWith('.git')) {
      repoName = repoName.substring(0, repoName.length - 4)
    }
    
    // Set in Zustand store and launch
    setAnalyzedRepo(repoName || 'repopilot/onboarding-engine')
    setViewMode('dashboard')
  }

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'Overview':
        return <OverviewTab />
      case 'Setup Guide':
        return <SetupGuideTab />
      case 'Important Files':
        return <ImportantFilesTab />
      case 'Architecture':
        return <ArchitectureTab />
      case 'APIs & Routes':
        return <ApiRoutesTab />
      case 'Env Variables':
        return <EnvVariablesTab />
      case 'AI Assistant':
        return <AiAssistantTab />
      default:
        return <OverviewTab />
    }
  }

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Cyber Grid Elements */}
      <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none z-0" />
      <div className="absolute inset-0 scanlines opacity-[0.02] pointer-events-none z-0" />

      {/* Background glowing particles sphere */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[500px] bg-cyan-500/[0.03] filter blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[500px] bg-purple-500/[0.03] filter blur-[100px] rounded-full pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        {booting ? (
          /* Cinematic boot sequence overlay */
          <motion.div
            key="boot-sequence"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-[#05070A] z-50 flex items-center justify-center font-mono p-4"
          >
            <div className="max-w-xl w-full glass-panel p-6 rounded-xl border-cyan-500/20 text-left space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Terminal className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="font-extrabold text-white text-md tracking-wider">
                  REPO<span className="text-cyan-400 text-glow-cyan">PILOT</span>
                </span>
                <span className="text-[10px] text-slate-500">v1.0.4</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300 min-h-36 max-h-48 overflow-y-auto">
                {bootLogs.map((log, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <span className="text-cyan-400 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 mr-1.5 animate-pulse" />
                  INITIALIZING HUB...
                </span>
                <span className="text-cyan-400 font-bold uppercase animate-pulse">BOOTING</span>
              </div>
            </div>
          </motion.div>
        ) : viewMode === 'landing' ? (
          /* Redesigned Landing Page View */
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-grow flex flex-col relative z-10"
          >
            {/* Landing Top Header Bar */}
            <header className="absolute top-0 w-full z-30 px-6 py-4 flex items-center justify-between border-b border-slate-900/30">
              <div className="flex items-center space-x-2">
                <Compass className="w-5.5 h-5.5 text-cyan-400 animate-spin [animation-duration:15s]" />
                <span className="font-extrabold text-white text-md tracking-wider">
                  REPO<span className="text-cyan-400 text-glow-cyan">PILOT</span>
                </span>
              </div>
              <button
                onClick={handleLaunchDashboard}
                className="px-4.5 py-2 border border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.1)] active:scale-95"
              >
                ENTER COMMAND HUB
              </button>
            </header>

            {/* Landing main modules */}
            <HeroSection 
              onAnalyzeRepo={handleAnalyzeRepoUrl}
            />
            
            <AiPreviewSection />
            <FeatureShowcase />

            {/* Ingest footer spec */}
            <footer className="py-8 bg-slate-950 border-t border-slate-900/80 text-center font-mono text-[10px] text-slate-600">
              <span>REPO-PILOT © 2026 | MISSION CONTROL INGESTION LAYER v1.0.4</span>
            </footer>
          </motion.div>
        ) : (
          /* Redesigned Dashboard View */
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-grow flex min-h-screen overflow-hidden relative z-10"
          >
            <Sidebar
              activeTab={currentTab}
              onSelectTab={setCurrentTab}
              onBackToLanding={handleBackToLanding}
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              <Navbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />
              
              <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-[#05070A] relative grid-bg">
                <div className="absolute inset-0 scanlines opacity-5 pointer-events-none" />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full relative z-10"
                  >
                    {renderActiveTab()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
