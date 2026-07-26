import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Compass, Terminal, Mail, ArrowRight, Lock, User, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GithubAuthProvider,
  GoogleAuthProvider,
  updateProfile
} from '../lib/firebase'

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [warning, setWarning] = useState<string | null>(location.state?.warning || null)

  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [warning])

  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const formatFirebaseError = (err: any): string => {
    const code = err?.code || ''
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return 'Invalid email or password. Please try again.'
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.'
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long.'
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.'
    }
    if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
      return 'Firebase is not configured. Please add VITE_FIREBASE_* keys to client/.env.'
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in popup was closed before completing.'
    }
    return err?.message || 'Authentication failed. Please try again.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (fullName.trim()) {
          await updateProfile(userCredential.user, { displayName: fullName.trim() })
        }
        setSuccess('Account created successfully! Redirecting...')
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        setSuccess('Signed in successfully! Redirecting...')
      }

      setTimeout(() => {
        setIsLoading(false)
        navigate('/') // Redirect to landing page
      }, 1000)
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(formatFirebaseError(err))
      setIsLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const provider = new GithubAuthProvider()
      await signInWithPopup(auth, provider)
      setSuccess('Signed in with GitHub! Redirecting...')
      setTimeout(() => {
        setIsLoading(false)
        navigate('/')
      }, 1000)
    } catch (err: any) {
      console.error('GitHub Auth error:', err)
      setError(formatFirebaseError(err))
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      setSuccess('Signed in with Google! Redirecting...')
      setTimeout(() => {
        setIsLoading(false)
        navigate('/')
      }, 1000)
    } catch (err: any) {
      console.error('Google Auth error:', err)
      setError(formatFirebaseError(err))
      setIsLoading(false)
    }
  }

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSignUp(!isSignUp)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
      {/* Top-Left Floating Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center space-x-2 px-4 py-2.5 rounded-xl glass-panel bg-[var(--bg-primary)]/70 hover:bg-[var(--glass-hover-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-lg group z-50 backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[var(--accent-primary)]" />
        <span className="text-sm font-semibold">Back to Landing Page</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-2xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-50" />

          <div className="flex items-center space-x-2.5 mb-8 mt-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="RepoPilot Logo" className="w-9 h-9 object-contain drop-shadow-md" />
            <span className="font-extrabold text-[var(--text-primary)] text-2xl tracking-tight">
              Repo<span className="opacity-60">Pilot</span>
            </span>
          </div>

          <div className="w-full text-center mb-8">
            <h1 className="text-xl font-semibold mb-2 tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {isSignUp ? 'Get started with AI-powered codebase analysis' : 'Sign in to your account to continue'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {warning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mb-6 p-3.5 bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-2.5 text-amber-600 dark:text-amber-400 font-semibold dark:font-normal text-xs text-left shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>{warning}</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mb-6 p-3 bg-red-500/15 dark:bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-2.5 text-red-600 dark:text-red-400 font-semibold dark:font-normal text-xs text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mb-6 p-3 bg-emerald-500/15 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start space-x-2.5 text-emerald-600 dark:text-emerald-400 font-semibold dark:font-normal text-xs text-left"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 base-btn px-4 py-2.5 rounded-lg font-medium text-xs transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>GitHub</span>
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 base-btn px-4 py-2.5 rounded-lg font-medium text-xs transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>
          </div>

          <div className="w-full flex items-center space-x-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border-color)]"></div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-secondary)]">OR</span>
            <div className="flex-1 h-px bg-[var(--border-color)]"></div>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-xs font-medium text-[var(--text-primary)]">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                {!isSignUp && (
                  <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Forgot password?
                  </a>
                )}
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
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center space-x-2 bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]'}`}
            >
              <span>
                {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign up' : 'Sign in')}
              </span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-[var(--text-secondary)]">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <a
                href="#"
                onClick={toggleMode}
                className="text-[var(--text-primary)] font-medium hover:underline cursor-pointer"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
