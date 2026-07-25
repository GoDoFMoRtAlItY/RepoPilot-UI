import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  ListTodo, 
  FileCode, 
  Network, 
  Terminal, 
  KeyRound, 
  MessageSquareCode, 
  LogOut, 
  X,
  Compass,
  Target,
  ShieldAlert,
  Activity,
  FileText
} from 'lucide-react'
import { useUIStore } from '../store/useUIStore'

interface SidebarProps {
  activeTab: string
  onSelectTab: (tab: string) => void
  onBackToLanding: () => void
  isOpen?: boolean
  onClose?: () => void
}

const menuItems = [
  { name: 'Overview', icon: BarChart3 },
  { name: 'Setup Guide', icon: ListTodo },
  { name: 'Important Files', icon: FileCode },
  { name: 'Architecture', icon: Network },
  { name: 'APIs & Routes', icon: Terminal },
  { name: 'Env Variables', icon: KeyRound },
  { name: 'Security Audit', icon: ShieldAlert },
  { name: 'Tech Debt Radar', icon: Activity },
  { name: 'Onboarding Score', icon: Target },
  { name: 'README Generator', icon: FileText },
  { name: 'AI Assistant', icon: MessageSquareCode }
]

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  onBackToLanding, 
  isOpen = false, 
  onClose 
}: SidebarProps) {
  
  const { isFocusMode } = useUIStore()

  const content = (
    <div className={`h-full flex flex-col justify-between bg-[var(--bg-primary)]/90 backdrop-blur-xl border-r border-[var(--border-color)] py-4 font-sans select-none overflow-y-auto transition-all duration-300 ${isFocusMode ? 'px-2' : 'px-4'}`}>
      <div className="space-y-5">
        {/* LOGO */}
        <div className={`flex items-center border-b border-[var(--border-color)] pb-3.5 shrink-0 transition-all ${isFocusMode ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 shrink-0">
              <Compass className="w-4 h-4 text-[#0284c7] dark:text-white" />
            </div>
            {!isFocusMode && (
              <span className="font-extrabold text-sm tracking-widest text-[var(--text-primary)] uppercase">
                REPO<span className="text-[#0284c7] dark:text-white font-extrabold">PILOT</span>
              </span>
            )}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-[#0284c7] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* HUD System Spec */}
        {!isFocusMode && (
          <div className="glass-panel p-2.5 rounded-lg font-mono text-[10px] space-y-1 shrink-0 border border-[var(--border-color)]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-tertiary)] font-semibold tracking-wider">SECTOR:</span>
              <span className="text-[var(--text-primary)] font-bold tracking-wide">MAIN_HUB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-tertiary)] font-semibold tracking-wider">SYS_STATUS:</span>
              <span className="text-emerald-600 dark:text-slate-200 font-bold tracking-wide">ONLINE</span>
            </div>
          </div>
        )}

        {/* NAVIGATION LINKS */}
        <nav className="flex flex-col gap-1 pt-1 pb-4">
          {menuItems.map((item) => {
            const isActive = activeTab === item.name
            return (
              <button
                key={item.name}
                onClick={() => {
                  onSelectTab(item.name)
                  if (onClose) onClose()
                }}
                className={`w-full flex items-center rounded-lg text-xs md:text-sm transition-all duration-150 cursor-pointer text-left group ${isFocusMode ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'} ${
                  isActive
                    ? 'bg-sky-100/90 dark:bg-[#24294d] text-[#0284c7] dark:text-[#a5b4fc] font-semibold border border-sky-200 dark:border-indigo-500/30 shadow-sm'
                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover-bg)] font-medium border border-transparent'
                }`}
                title={isFocusMode ? item.name : undefined}
              >
                <item.icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-[#0284c7] dark:text-[#a5b4fc] opacity-100' : 'text-[var(--text-tertiary)] opacity-90 group-hover:text-[var(--text-primary)]'}`} />
                {!isFocusMode && <span className="tracking-wide truncate">{item.name}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* FOOTER ACTION */}
      <div className="border-t border-[var(--border-color)] pt-3.5 mt-auto shrink-0">
        <button
          onClick={onBackToLanding}
          className={`w-full flex items-center rounded-lg text-xs md:text-sm text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-semibold transition-all duration-150 cursor-pointer hover:bg-rose-500/10 ${isFocusMode ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'}`}
          title={isFocusMode ? "Exit" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
          {!isFocusMode && <span className="truncate">Exit Command Hub</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (visible lg+) */}
      <aside className={`hidden lg:block h-screen sticky top-0 shrink-0 transition-all duration-300 ${isFocusMode ? 'w-16' : 'w-64'}`}>
        {content}
      </aside>

      {/* Mobile Drawer (visible when isOpen on smaller screens) */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Overlay backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            {/* Menu sheet */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-64 h-full bg-[var(--bg-primary)] z-50 shadow-2xl"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
