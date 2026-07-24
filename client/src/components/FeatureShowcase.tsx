import { motion } from 'framer-motion'
import { 
  Network, 
  ListTodo, 
  FileCode, 
  Terminal, 
  ShieldAlert, 
  MessageSquareCode,
  FileSearch
} from 'lucide-react'

const features = [
  {
    icon: FileSearch,
    title: 'Repository Understanding',
    description: 'Ingest directories and parse packages automatically. Builds an indexed code map tracking structural dependencies.',
    glow: 'var(--accent-secondary)',
    status: 'SYS_READY'
  },
  {
    icon: ListTodo,
    title: 'Guided Onboarding',
    description: 'An onboarding checklist showing exact setup tasks. Simulate local terminal command executions directly from the GUI.',
    glow: 'var(--accent-primary)',
    status: 'SYS_LOADED'
  },
  {
    icon: FileCode,
    title: 'Smart File Prioritization',
    description: 'Find crucial files immediately. Automatically tag directories by relevance (High/Medium/Low) with built-in search filters.',
    glow: 'var(--accent-primary)',
    status: 'SYS_INDEXED'
  },
  {
    icon: Network,
    title: 'Architecture Mapping',
    description: 'Auto-synthesize codebase block diagrams. Double-click modules to drill down into dependency maps with animated signal paths.',
    glow: 'var(--accent-secondary)',
    status: 'SYS_MAPPED'
  },
  {
    icon: Terminal,
    title: 'API Discovery',
    description: 'Scan and expose routing patterns. Lists GET/POST endpoints with authorization guards and method filters.',
    glow: 'var(--accent-success, #10b981)',
    status: 'SYS_PARSED'
  },
  {
    icon: ShieldAlert,
    title: 'Environment Extraction',
    description: 'Never guess missing configurations again. Outlines required, optional, and default environment setups with validation tags.',
    glow: 'var(--accent-warning, #f59e0b)',
    status: 'SYS_READY'
  },
  {
    icon: MessageSquareCode,
    title: 'AI Assistant',
    description: 'Converse with an AI that knows the entire codebase. Explains functions, details architectural scopes, and writes boilerplate files.',
    glow: 'var(--accent-secondary)',
    status: 'SYS_ACTIVE'
  }
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
}

export default function FeatureShowcase() {
  return (
    <section id="features" className="py-24 px-4 md:px-8 bg-[var(--bg-primary)] relative overflow-hidden select-none">
      
      {/* Background neon elements — lowered opacity in light mode */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[300px] bg-[var(--accent-primary)] opacity-[0.01] dark:opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* HUD border lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-mono tracking-widest text-[var(--accent-secondary)] uppercase">SYS_CAPABILITIES</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight font-sans">
            Futuristic Command Modules
          </h3>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-xs md:text-sm font-sans">
            Skip reading endless config setups and diving blindly into packages. RepoPilot compiles the developer blueprints for you.
          </p>
        </div>

        {/* Features grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="glass-panel p-6 rounded-2xl text-left flex flex-col justify-between group cursor-default relative overflow-hidden transition-all duration-300"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-[0.15] transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${feature.glow}, transparent 70%)` }}
              />

              {/* Top border illuminated glow line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-secondary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-sunken,var(--bg-secondary))] border border-[var(--border-color)] flex items-center justify-center group-hover:border-[var(--accent-secondary)]/50 transition-colors duration-300 shadow-sm">
                    <feature.icon className="w-5 h-5 text-[var(--accent-secondary)] group-hover:animate-pulse" />
                  </div>
                  {/* Status Indicator */}
                  <span className="text-[8px] font-mono font-bold tracking-widest bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/25 px-2 py-0.5 rounded text-[var(--accent-secondary)] animate-pulse">
                    {feature.status}
                  </span>
                </div>
                
                <h4 className="text-lg font-bold text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-secondary)] transition-colors duration-300 font-sans">
                  {feature.title}
                </h4>
                <p className="text-[var(--text-secondary)] text-xs md:text-sm leading-relaxed font-sans">
                  {feature.description}
                </p>
              </div>

              {/* Laser dot technical graphics */}
              <div className="mt-4 border-t border-[var(--border-color)] pt-3 flex items-center justify-between text-[9px] text-[var(--text-secondary)] font-mono relative z-10">
                <span>SEC_INGEST: 100%</span>
                <span className="text-[7px] text-[var(--accent-secondary)] opacity-40">● ● ● ●</span>
              </div>

              {/* HUD scanline overlay on hover */}
              <div className="absolute inset-0 bg-[var(--accent-secondary)]/[0.01] opacity-0 group-hover:opacity-100 scanlines pointer-events-none transition-opacity duration-300 z-0" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
