import { motion } from 'framer-motion'
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function OnboardingScoreCard() {
  const { analysis } = useRepoStore()
  
  const score = analysis?.onboardingScore.score || 0
  const breakdown = analysis?.onboardingScore.breakdown || []

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]'
    if (score >= 50) return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
    return 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/30'
    if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-red-500/10 border-red-500/30'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-[var(--text-primary)] text-left"
    >
      {/* HUD Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10 flex-1">
          <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>DEVELOPER EXPERIENCE METRICS</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans">
            Onboarding Score
          </h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl">
            A metric quantifying how easy it is for a new developer to set up and understand this repository.
          </p>
        </div>

        {/* Large Score Display */}
        <div className={`relative z-10 flex flex-col items-center justify-center p-6 rounded-xl border ${getScoreBg(score)} min-w-[150px]`}>
          <span className="text-[10px] text-[var(--text-secondary)] font-bold tracking-widest uppercase mb-1">TOTAL SCORE</span>
          <div className="flex items-baseline space-x-1">
            <span className={`text-4xl md:text-5xl font-black ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-[var(--text-secondary)] font-bold text-lg">/100</span>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-widest uppercase mb-2 flex items-center space-x-2 border-b border-[var(--border-color)] pb-2">
          <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Evaluation Breakdown</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {breakdown.map((item, index) => (
            <div 
              key={index} 
              className={`glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${item.passed ? 'border-green-500/20' : 'border-[var(--border-color)] hover:border-[var(--border-color)]'}`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="mt-0.5">
                  {item.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold text-sm font-sans ${item.passed ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {item.check}
                    </span>
                    {!item.passed && item.points > 10 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                        <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                        High Impact
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs font-sans">
                    {item.detail}
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 flex items-center justify-end sm:w-24">
                <span className={`text-xs font-bold px-2.5 py-1 rounded border ${item.passed ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                  {item.passed ? `+${item.points} pts` : `0 / ${item.points} pts`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {breakdown.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-xl text-[var(--text-secondary)] font-sans">
          No onboarding metrics available for this repository.
        </div>
      )}
    </motion.div>
  )
}
