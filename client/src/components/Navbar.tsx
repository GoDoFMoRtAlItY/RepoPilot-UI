import { useState } from 'react'
import { 
  RefreshCw, 
  Menu, 
  Database, 
  Activity, 
  GitBranch 
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

interface NavbarProps {
  onToggleMobileMenu: () => void
}

export default function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const { 
    analyzedRepo, 
    analyzeRepo,
    isAnalyzing,
    error
  } = useRepoStore()

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const repositories = [
    'repopilot/onboarding-engine',
    'facebook/react',
    'vercel/next.js',
    'tailwindlabs/tailwindcss'
  ]

  return (
    <header className="sticky top-0 z-40 bg-[#05070A]/85 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 h-16 flex items-center justify-between font-mono select-none">
      
      {/* Left: Mobile Toggle & Repo Indicator */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Repository selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 px-3.5 py-1.5 rounded-lg text-xs md:text-sm text-slate-100 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{analyzedRepo}</span>
            <span className="text-[10px] text-slate-500 font-normal">▼</span>
          </button>

          {dropdownOpen && (
            <>
              {/* Screen click blocker */}
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-2 w-64 bg-[#0B1220] border border-slate-800 rounded-lg shadow-2xl z-20 p-1 divide-y divide-slate-800/50">
                {repositories.map((repo) => (
                  <button
                    key={repo}
                    onClick={() => {
                      const [owner, name] = repo.split('/')
                      analyzeRepo(owner, name)
                      setDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-md text-xs font-sans tracking-wide transition-all text-slate-300 hover:text-white hover:bg-slate-900 flex items-center space-x-2 ${
                      analyzedRepo === repo ? 'bg-blue-950/20 text-cyan-400 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{repo}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Live stats & Sync controls */}
      <div className="flex items-center space-x-4 md:space-x-6 text-[10px] md:text-xs">
        
        {/* Latency & status parameters */}
        <div className="hidden sm:flex items-center space-x-4 text-slate-400 border-r border-slate-800/80 pr-6">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span>PING: <span className="text-white">12ms</span></span>
          </div>
          <div>
            <span>INTELLIGENCE: <span className="text-cyan-400">OPENROUTER</span></span>
          </div>
        </div>

        {/* Sync / Analysis progression tracking */}
        <div className="flex items-center space-x-3">
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="text-cyan-400 font-semibold tracking-wider animate-pulse">
                INGESTING...
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {error ? (
                <span className="hidden md:inline-flex text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded text-[10px]">
                  FAILED
                </span>
              ) : (
                <span className="hidden md:inline-flex text-green-400 bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded text-[10px]">
                  SYNCED
                </span>
              )}
              <button
                onClick={() => {
                  if (analyzedRepo) {
                    const [owner, repo] = analyzedRepo.split('/')
                    analyzeRepo(owner, repo, true)
                  }
                }}
                className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer text-xs"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>Re-Analyze</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
