import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Compass, LogOut, User as UserIcon, Mail, Shield, Calendar, ArrowLeft, Edit3, Check, Sparkles } from 'lucide-react'
import { auth, signOut, updateProfile } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-[var(--text-secondary)] tracking-wider">LOADING PROFILE...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <UserIcon className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Authentication Required</h2>
            <p className="text-xs text-[var(--text-secondary)]">Please sign in to view and manage your profile settings.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full base-btn px-4 py-2.5 rounded-lg font-medium text-xs transition-all shadow-sm cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut(auth)
      navigate('/')
    } catch (err) {
      console.error('Sign out error:', err)
      setIsLoggingOut(false)
    }
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newDisplayName.trim()) return
    try {
      await updateProfile(user, { displayName: newDisplayName.trim() })
      setIsEditing(false)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
    }
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    if (email) return email.slice(0, 2).toUpperCase()
    return 'RP'
  }

  const createdAtDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently'

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 md:p-8 relative z-10">
      {/* Top Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 glass-panel px-3.5 py-2 rounded-xl text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MISSION CONTROL</span>
        </button>

        <div className="flex items-center space-x-2 glass-panel px-4 py-2 rounded-xl">
          <Compass className="w-4 h-4 text-[var(--accent-primary)] opacity-90" />
          <span className="font-extrabold text-[var(--text-primary)] text-xs tracking-wider">
            REPO<span className="opacity-60">PILOT</span> PROFILE
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl glass-panel rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden border border-[var(--border-color)]"
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--accent-primary)] via-purple-500 to-pink-500 opacity-80" />

        {/* Profile Header section */}
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 pb-8 border-b border-[var(--border-color)]">
          {/* Avatar / Photo */}
          <div className="relative group shrink-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[var(--accent-primary)]/40 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 border-2 border-[var(--accent-primary)]/40 flex items-center justify-center shadow-xl text-[var(--text-primary)] font-extrabold text-2xl tracking-wider">
                {getInitials(user.displayName, user.email)}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center space-x-1 shadow-md">
              <Sparkles className="w-2.5 h-2.5" />
              <span>ACTIVE</span>
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                {isEditing ? (
                  <form onSubmit={handleUpdateName} className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="Enter full name"
                      className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
                      autoFocus
                    />
                    <button type="submit" className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors cursor-pointer">
                      <Check className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      {user.displayName || 'RepoPilot Pilot'}
                    </h1>
                    <button
                      onClick={() => {
                        setNewDisplayName(user.displayName || '')
                        setIsEditing(true)
                      }}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      title="Edit Display Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {updateSuccess && (
                  <span className="text-[10px] text-emerald-400 font-mono block mt-1">Profile name updated successfully!</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-2 text-xs text-[var(--text-secondary)]">
              <Mail className="w-3.5 h-3.5 opacity-70" />
              <span>{user.email}</span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <Shield className="w-3 h-3 mr-1 opacity-80" />
                PILOT TIER: PRO
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <Calendar className="w-3 h-3 mr-1 opacity-80" />
                JOINED: {createdAtDate}
              </span>
            </div>
          </div>
        </div>

        {/* Account Info Grid */}
        <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[var(--border-color)]">
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)]/40 border border-[var(--border-color)]/50 space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">Authentication Provider</span>
            <p className="text-xs font-semibold text-[var(--text-primary)] capitalize">
              {user.providerData[0]?.providerId?.replace('.com', '') || 'Email / Password'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)]/40 border border-[var(--border-color)]/50 space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">User ID (UID)</span>
            <p className="text-xs font-mono text-[var(--text-secondary)] truncate" title={user.uid}>
              {user.uid}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate('/repo/facebook/react')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 text-[var(--text-primary)] border border-[var(--accent-primary)]/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Compass className="w-4 h-4" />
            <span>Launch Analysis Dashboard</span>
          </button>

          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
