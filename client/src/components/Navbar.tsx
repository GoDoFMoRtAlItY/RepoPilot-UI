import { useState } from 'react'
import { 
  RefreshCw, 
  Menu, 
  Database, 
  Activity, 
  GitBranch,
  Focus,
  Sun,
  Moon
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'
import { useUIStore } from '../store/useUIStore'

interface NavbarProps {
  onToggleMobileMenu: () => void
}

export default function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const { 
    analyzedRepo, 
    analyzeRepo,
    isAnalyzing,
    error,
    aiKey
  } = useRepoStore()

  const { isFocusMode, toggleFocusMode, theme, toggleTheme } = useUIStore()

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const repositories = [
    'repopilot/onboarding-engine',
    'facebook/react',
    'vercel/next.js',
    'tailwindlabs/tailwindcss'
  ]

  return (
    <header className="sticky top-0 z-40 bg-transparent backdrop-blur-md border-b border-[var(--border-color)] px-4 md:px-6 h-16 flex items-center justify-between font-sans select-none">
      
      {/* Left: Mobile Toggle & Repo Indicator */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="base-btn flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
            <span className="font-semibold truncate max-w-[120px] md:max-w-[300px]">{analyzedRepo}</span>
            <span className="text-[10px] text-[var(--text-secondary)] font-normal shrink-0">▼</span>
          </button>

          {dropdownOpen && (
            <>
              {/* Screen click blocker */}
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-2 w-64 glass-panel rounded-lg shadow-2xl z-20 p-1 divide-y divide-[var(--border-color)]">
                {repositories.map((repo) => (
                  <button
                    key={repo}
                    onClick={() => {
                      const [owner, name] = repo.split('/')
                      analyzeRepo(owner, name)
                      setDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-md text-xs font-sans tracking-wide transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover-bg)] flex items-center space-x-2 ${
                      analyzedRepo === repo ? 'bg-[var(--glass-hover-bg)] text-[var(--text-primary)] font-medium border-l-2 border-[var(--text-primary)]' : ''
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5 opacity-50 shrink-0" />
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
        <div className="hidden sm:flex items-center space-x-4 text-[var(--text-secondary)] border-r border-[var(--border-color)] pr-6 font-mono text-[10px]">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 opacity-80" />
            <span>PING: <span className="text-[var(--text-primary)]">12ms</span></span>
          </div>
          <div>
            <span>INTELLIGENCE: <span className="text-[var(--text-primary)]">{aiKey ? (aiKey.startsWith('AIza') ? 'GEMINI (USER)' : 'OPENROUTER (USER)') : 'HYBRID AI'}</span></span>
          </div>
        </div>

        {/* Sync / Analysis progression tracking */}
        <div className="flex items-center space-x-3">
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 opacity-80 animate-spin" />
              <span className="font-semibold tracking-wider opacity-80 animate-pulse font-mono text-[10px]">
                INGESTING...
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 md:space-x-3">
              <button
                onClick={toggleTheme}
                className="base-btn flex items-center justify-center p-1.5 md:px-3 md:py-1.5 rounded-lg cursor-pointer text-xs"
                title="Toggle Light/Dark Theme"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 opacity-70" /> : <Moon className="w-3.5 h-3.5 opacity-70" />}
              </button>

              <button
                onClick={() => {
                  if (analyzedRepo) {
                    const [owner, repo] = analyzedRepo.split('/')
                    analyzeRepo(owner, repo, true)
                  }
                }}
                className="base-btn flex items-center justify-center p-1.5 md:px-3 md:py-1.5 rounded-lg cursor-pointer text-xs"
                title="Re-Analyze Repository"
              >
                <RefreshCw className="w-3.5 h-3.5 opacity-70" />
              </button>
              
              <button
                onClick={toggleFocusMode}
                className={`base-btn flex items-center justify-center p-1.5 md:px-3 md:py-1.5 rounded-lg cursor-pointer text-xs ${isFocusMode ? 'bg-[var(--glass-hover-bg)] border-[var(--glass-hover-border)]' : ''}`}
                title="Toggle Focus Mode"
              >
                <Focus className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
