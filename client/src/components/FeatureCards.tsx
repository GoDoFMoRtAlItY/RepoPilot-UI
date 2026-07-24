import { motion } from 'framer-motion'
import { Terminal, Cpu, ShieldAlert } from 'lucide-react'

const featureCards = [
  {
    icon: Terminal,
    title: 'Intelligence',
    description:
      'Instantly analyze complex codebases. We transform raw source code into actionable architectural insights and interactive visual graphs.',
    accentColor: 'text-indigo-400',
    glowColor: 'var(--accent-primary)',
    borderHover: 'group-hover:border-[var(--accent-primary)]',
  },
  {
    icon: Cpu,
    title: 'Automation',
    description:
      'Let AI do the heavy lifting. Generate documentation, map APIs, and discover tech debt seamlessly within seconds.',
    accentColor: 'text-emerald-400',
    glowColor: 'var(--accent-success, #10b981)',
    borderHover: 'group-hover:border-[var(--accent-success,#10b981)]',
  },
  {
    icon: ShieldAlert,
    title: 'Security',
    description:
      'Scan for vulnerabilities, exposed secrets, and insecure patterns. Get actionable security audit reports with severity scoring.',
    accentColor: 'text-amber-400',
    glowColor: 'var(--accent-warning, #f59e0b)',
    borderHover: 'group-hover:border-[var(--accent-warning,#f59e0b)]',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
  },
}

export default function FeatureCards() {
  return (
    <section className="py-20 px-4 md:px-8 relative overflow-hidden select-none bg-[var(--bg-primary)]">
      {/* Subtle gradient backdrop */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-xs font-mono tracking-widest text-[var(--accent-primary)] uppercase">
            CORE_MODULES
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Built for developer velocity
          </h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-lg mx-auto">
            Three pillars powering every repository analysis.
          </p>
        </div>

        {/* 3-column grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {featureCards.map((card) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`glass-panel p-6 md:p-8 rounded-2xl flex flex-col gap-4 group cursor-default relative overflow-hidden border border-[var(--border-color)] ${card.borderHover} transition-all duration-300`}
            >
              {/* Dynamic glow in dark mode, hidden in light mode */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-15 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${card.glowColor}, transparent 70%)` }}
              />

              {/* Top glow line on hover */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-secondary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-sunken,var(--bg-secondary))] border border-[var(--border-color)] flex items-center justify-center group-hover:border-[var(--accent-secondary)]/50 transition-colors duration-300 shadow-sm relative z-10">
                <card.icon className={`w-5 h-5 ${card.accentColor} dark:opacity-100 opacity-90`} />
              </div>

              {/* Title */}
              <h4 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {card.title}
              </h4>

              {/* Description — high contrast */}
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {card.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
