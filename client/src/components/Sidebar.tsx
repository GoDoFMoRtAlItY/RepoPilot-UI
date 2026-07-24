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
    <div className={`h-full flex flex-col justify-between bg-transparent border-r border-[var(--border-color)] py-4 font-sans select-none overflow-y-auto transition-all duration-300 ${isFocusMode ? 'px-2' : 'px-4'}`}>
      <div className="space-y-6">
        {/* LOGO */}
        <div className={`flex items-center border-b border-[var(--border-color)] pb-4 shrink-0 transition-all ${isFocusMode ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 opacity-80" />
            {!isFocusMode && (
              <span className="font-extrabold text-[var(--text-primary)] text-lg tracking-wider">
                REPO<span className="text-[var(--text-primary)]/60">PILOT</span>
              </span>
            )}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* HUD System Spec */}
        {!isFocusMode && (
          <div className="glass-panel p-2.5 rounded text-[10px] text-[var(--text-primary)]/50 space-y-1 shrink-0 font-mono">
            <div className="flex justify-between">
              <span>SECTOR:</span>
              <span className="text-[var(--text-primary)]/80">MAIN_HUB</span>
            </div>
            <div className="flex justify-between">
              <span>SYS_SYS:</span>
              <span className="text-[var(--text-primary)]/80">ONLINE</span>
            </div>
          </div>
        )}

        {/* NAVIGATION LINKS */}
        <nav className="flex flex-col gap-1.5 pt-2 pb-4">
          {menuItems.map((item) => {
            const isActive = activeTab === item.name
            return (
              <button
                key={item.name}
                onClick={() => {
                  onSelectTab(item.name)
                  if (onClose) onClose()
                }}
                className={`w-full flex items-center rounded-lg text-sm transition-all cursor-pointer text-left ${isFocusMode ? 'justify-center p-3' : 'space-x-3 px-4 py-3'} ${
                  isActive
                    ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium shadow-sm'
                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover-bg)]'
                }`}
                title={isFocusMode ? item.name : undefined}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                {!isFocusMode && <span className="tracking-wide truncate">{item.name}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* FOOTER ACTION */}
      <div className="border-t border-[var(--border-color)] pt-4 mt-auto shrink-0">
        <button
          onClick={onBackToLanding}
          className={`w-full flex items-center rounded-lg text-sm text-red-400/80 hover:text-red-400 transition-all cursor-pointer ${isFocusMode ? 'justify-center p-3' : 'space-x-3 px-4 py-3 hover:bg-red-500/10'}`}
          title={isFocusMode ? "Exit" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
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
