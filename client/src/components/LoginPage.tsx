import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Compass, Terminal, Mail, ArrowRight, Lock } from 'lucide-react'
import InteractiveBackground from './ui/InteractiveBackground'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate network delay for login
    setTimeout(() => {
      setIsLoading(false)
      navigate('/repo/facebook/react') // Mock redirect to a dashboard
    }, 800)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      {/* Decorative background elements removed, relying on InteractiveBackground from App.tsx/here */}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-2xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Subtle gradient flair at the top of the card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-50" />
          
          <div className="flex items-center space-x-2 mb-8 mt-2 cursor-pointer" onClick={() => navigate('/')}>
            <Compass className="w-8 h-8 opacity-90 text-[var(--accent-primary)]" />
            <span className="font-extrabold text-[var(--text-primary)] text-2xl tracking-tight">
              Repo<span className="opacity-60">Pilot</span>
            </span>
          </div>
          
          <div className="w-full text-center mb-8">
            <h1 className="text-xl font-semibold mb-2 tracking-tight">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)]">Sign in to your account to continue</p>
          </div>

          <button 
            type="button"
            className="w-full flex items-center justify-center space-x-3 base-btn px-4 py-3 rounded-lg font-medium text-sm transition-all shadow-sm mb-6"
          >
            <Terminal className="w-4 h-4" />
            <span>Continue with GitHub</span>
          </button>

          <div className="w-full flex items-center space-x-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border-color)]"></div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-secondary)]">OR</span>
            <div className="flex-1 h-px bg-[var(--border-color)]"></div>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--text-primary)]">Password</label>
                <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center space-x-2 bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]'}`}
            >
              <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-[var(--text-secondary)]">
              Don't have an account? <a href="#" className="text-[var(--text-primary)] font-medium hover:underline">Sign up</a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
