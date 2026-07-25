import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRepoStore } from './store/useRepoStore'
import { useUIStore } from './store/useUIStore'
import HeroSection from './components/HeroSection'
import FeatureShowcase from './components/FeatureShowcase'
import FeatureCards from './components/FeatureCards'
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
import SecurityTab from './components/SecurityTab'
import TechDebtTab from './components/TechDebtTab'
import OnboardingScoreCard from './components/OnboardingScoreCard'
import ReadmeGeneratorTab from './components/ReadmeGeneratorTab'
import LineByLineAnalysis from './components/LineByLineAnalysis'
import { Compass, Terminal, ShieldAlert, Sun, Moon } from 'lucide-react'
import Lenis from 'lenis'
import InteractiveBackground from './components/ui/InteractiveBackground'
import LoginPage from './components/LoginPage'

function LandingPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useUIStore()

  useEffect(() => {
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
  }, [])

  const handleAnalyzeRepoUrl = (url: string) => {
    let repoName = url.trim()
    
    // Remove protocol and www if present
    repoName = repoName.replace(/^(https?:\/\/)?(www\.)?/, '')
    // Remove github.com/ if present
    repoName = repoName.replace(/^github\.com\//, '')
    
    const match = repoName.match(/^([^/]+)\/([^/]+)/)
    
    if (match) {
      const owner = match[1]
      const repo = match[2].replace(/\.git$/, '')
      navigate(`/repo/${owner}/${repo}`)
    }
  }

  return (
    <motion.div
      key="landing-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-grow flex flex-col relative z-10"
    >
      <header className="absolute top-0 w-full z-30 px-4 md:px-6 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 glass-panel px-4 py-2.5 rounded-2xl pointer-events-auto shadow-md border border-white/80 dark:border-white/40 bg-white/85 dark:bg-white/90 backdrop-blur-xl">
          <Compass className="w-5 h-5 text-slate-800 dark:text-slate-800" />
          <span className="font-black text-slate-900 dark:text-slate-900 text-base tracking-wider">
            REPO<span className="text-slate-600 dark:text-slate-600 font-bold">PILOT</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3 glass-panel px-3 py-2 rounded-2xl pointer-events-auto shadow-md border border-white/80 dark:border-white/40 bg-white/85 dark:bg-white/90 backdrop-blur-xl">
          <button onClick={toggleTheme} className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-200/60 text-slate-800 dark:text-slate-800 transition-all cursor-pointer">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-800 dark:text-slate-800" /> : <Moon className="w-4 h-4 text-slate-800 dark:text-slate-800" />}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-3.5 py-1.5 md:px-4 md:py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:text-slate-800 rounded-xl text-[10px] md:text-xs font-mono font-bold tracking-wider cursor-pointer shadow-sm transition-all"
          >
            LOGIN
          </button>
          <button
            onClick={() => navigate('/repo/gothinkster/node-express-realworld-example-app')}
            className="px-3.5 py-1.5 md:px-4 md:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] md:text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex items-center shadow-md border border-slate-700"
          >
            <span className="hidden sm:inline mr-1">COMMAND</span>HUB
          </button>
        </div>
      </header>

      <HeroSection onAnalyzeRepo={handleAnalyzeRepoUrl} />
      <FeatureCards />
      <AiPreviewSection />
      <FeatureShowcase />

      <footer className="py-8 bg-transparent border-t border-[var(--border-color)] text-center font-mono text-[10px] text-[var(--text-tertiary)]">
        <span>REPO-PILOT © 2026 | MISSION CONTROL</span>
      </footer>
    </motion.div>
  )
}

function DashboardPage() {
  const { owner, repo } = useParams()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentTab, setCurrentTab, analyzeRepo, analyzedRepo } = useRepoStore()

  useEffect(() => {
    if (owner && repo && analyzedRepo !== `${owner}/${repo}`) {
      analyzeRepo(owner, repo)
    }
  }, [owner, repo, analyzedRepo, analyzeRepo])

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'Overview': return <OverviewTab />
      case 'Setup Guide': return <SetupGuideTab />
      case 'Important Files': return <ImportantFilesTab />
      case 'Architecture': return <ArchitectureTab />
      case 'APIs & Routes': return <ApiRoutesTab />
      case 'Env Variables': return <EnvVariablesTab />
      case 'Security Audit': return <SecurityTab />
      case 'Tech Debt Radar': return <TechDebtTab />
      case 'Onboarding Score': return <OnboardingScoreCard />
      case 'README Generator': return <ReadmeGeneratorTab />
      case 'AI Assistant': return <AiAssistantTab />
      default: return <OverviewTab />
    }
  }

  return (
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
        onBackToLanding={() => navigate('/')}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />
        
        <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-transparent relative">
          
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
  )
}

export default function App() {
  const { theme } = useUIStore()
  const [booting, setBooting] = useState(true)
  const [bootLogs, setBootLogs] = useState<string[]>([])
  
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

  return (
    <div className={theme}>
      <InteractiveBackground>
        <div className="flex flex-col font-sans relative overflow-hidden h-full">

      <AnimatePresence mode="wait">
        {booting ? (
          <motion.div
            key="boot-sequence"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-[#05070A] z-50 flex items-center justify-center font-mono p-4"
          >
            <div className="max-w-xl w-full glass-panel p-6 rounded-xl text-left space-y-4">
              <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
                <Terminal className="w-5 h-5 text-white/80" />
                <span className="font-extrabold text-white text-md tracking-wider">
                  REPO<span className="text-white/60">PILOT</span>
                </span>
                <span className="text-[10px] text-white/40">v1.0.4</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300 min-h-36 max-h-48 overflow-y-auto">
                {bootLogs.map((log, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <span className="text-white/40 select-none">&gt;</span>
                    <span className="text-white/80">{log}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-[10px] text-white/50">
                <span className="flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                  INITIALIZING HUB...
                </span>
                <span className="font-bold uppercase opacity-80">BOOTING</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/repo/:owner/:repo" element={<DashboardPage />} />
            <Route path="/repo/:owner/:repo/analyze" element={<LineByLineAnalysis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </AnimatePresence>
      </div>
    </InteractiveBackground>
    </div>
  )
}
