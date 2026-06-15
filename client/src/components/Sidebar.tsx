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
  ShieldAlert
} from 'lucide-react'

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
  { name: 'Onboarding Score', icon: Target },
  { name: 'AI Assistant', icon: MessageSquareCode }
]

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  onBackToLanding, 
  isOpen = false, 
  onClose 
}: SidebarProps) {
  
  const content = (
    <div className="h-full flex flex-col justify-between bg-[#0B1220]/95 border-r border-slate-800/80 p-4 font-mono select-none overflow-y-auto">
      <div className="space-y-6">
        {/* LOGO */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin [animation-duration:12s]" />
            <span className="font-sans font-extrabold text-white text-lg tracking-wider">
              REPO<span className="text-cyan-400 text-glow-cyan">PILOT</span>
            </span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* HUD System Spec */}
        <div className="bg-slate-950/80 border border-slate-800/60 p-2.5 rounded text-[10px] text-slate-400 space-y-1 shrink-0">
          <div className="flex justify-between">
            <span>SECTOR:</span>
            <span className="text-cyan-400">MAIN_HUB</span>
          </div>
          <div className="flex justify-between">
            <span>SYS_SYS:</span>
            <span className="text-green-400">ONLINE</span>
          </div>
        </div>

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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600/25 border border-blue-500/40 text-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.15)] font-semibold'
                    : 'bg-transparent border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60 hover:border-slate-800/60'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="font-sans tracking-wide truncate">{item.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* FOOTER ACTION */}
      <div className="border-t border-slate-800/80 pt-4 mt-auto shrink-0">
        <button
          onClick={onBackToLanding}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:text-red-300 bg-red-950/15 border border-transparent hover:border-red-900/30 hover:bg-red-950/30 transition-all cursor-pointer font-sans"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="truncate">Exit Command Hub</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (visible lg+) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer (visible when isOpen on smaller screens) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Menu sheet */}
          <div className="relative w-64 h-full bg-[#0B1220] z-50">
            {content}
          </div>
        </div>
      )}
    </>
  )
}
