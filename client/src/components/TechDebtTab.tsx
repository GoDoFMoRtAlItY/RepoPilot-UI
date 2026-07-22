import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code,
  PackageX,
  FileWarning,
  Check,
  ShieldCheck,
  Sword,
  Trophy,
  Sparkles,
  Target,
  Activity,
  AlertTriangle,
  Flame,
  History,
  RotateCcw,
  FileText
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

// Add standard severity colors
const SEVERITY_COLORS = {
  critical: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20 dark:border-purple-500/30',
  high: 'text-red-400 bg-red-500/10 border-red-500/30',
  medium: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  low: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  info: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
}

export default function TechDebtTab() {
  const { analysis, setCurrentTab, sendChatMessage } = useRepoStore()
  
  // Local gamification state
  const [xp, setXp] = useState(0)
  const [completedQuests, setCompletedQuests] = useState<string[]>([])
  const [activeView, setActiveView] = useState<'quests' | 'radar' | 'matrix' | 'history'>('quests')

  const debtItems = useMemo(() => {
    if (!analysis) return []
    const items: any[] = []

    const addItems = (sourceArray: any[], baseCategory: string) => {
      if (!Array.isArray(sourceArray)) return;
      sourceArray.forEach((item, idx) => {
        // Synthesize effort and impact based on severity or message
        let impact = 5;
        let effort = 5;
        const sev = (item.severity || 'medium').toLowerCase();
        
        if (sev === 'critical') { impact = 9; effort = 8; }
        else if (sev === 'high') { impact = 7; effort = 6; }
        else if (sev === 'medium') { impact = 5; effort = 4; }
        else if (sev === 'low') { impact = 3; effort = 2; }

        // Adjust effort based on keywords
        const msg = (item.message || '').toLowerCase();
        if (msg.includes('refactor') || msg.includes('architecture')) effort += 2;
        if (msg.includes('typo') || msg.includes('rename')) effort -= 2;
        
        impact = Math.max(1, Math.min(10, impact));
        effort = Math.max(1, Math.min(10, effort));

        items.push({
          id: `${baseCategory}-${idx}-${item.type || 'debt'}`,
          type: item.type || baseCategory,
          category: baseCategory,
          message: item.message || item.recommendation || 'Technical debt identified.',
          severity: sev,
          impact,
          effort,
          file: item.file || 'Global',
          line: item.line,
          githubUrl: item.githubUrl
        })
      })
    }

    addItems(analysis.securityAlerts, 'Security');
    addItems(analysis.dependencySecurity, 'Dependencies');
    addItems(analysis.staticCodeAnalysis, 'Code Quality');
    addItems(analysis.gitHygiene, 'Hygiene');
    
    // Add generic recommendations as architectural debt
    if (Array.isArray(analysis.securityRecommendations)) {
      analysis.securityRecommendations.forEach((rec, idx) => {
        items.push({
          id: `Architecture-${idx}`,
          type: 'Missing Config',
          category: 'Architecture',
          message: rec,
          severity: 'medium',
          impact: 6,
          effort: 4,
          file: 'Global'
        })
      })
    }

    return items;
  }, [analysis])

  const pendingDebt = debtItems.filter(item => !completedQuests.includes(item.id))

  const getReward = (severity: string) => {
    switch(severity) {
      case 'critical': return 200;
      case 'high': return 150;
      case 'medium': return 100;
      case 'low': return 50;
      default: return 75;
    }
  }

  const handleAcceptQuest = (alert: any) => {
    setCurrentTab('AI Assistant')
    sendChatMessage(`I want to accept this Tech Debt Quest: "${alert.message}" in file \`${alert.file}\`${alert.line ? ` at line ${alert.line}` : ''}. Can you guide me on how to fix this issue step-by-step?`)
  }

  const handleCompleteQuest = (id: string, reward: number) => {
    if (!completedQuests.includes(id)) {
      setCompletedQuests([...completedQuests, id])
      setXp(prev => prev + reward)
    }
  }

  const handleRedoQuest = (id: string, reward: number) => {
    setCompletedQuests(prev => prev.filter(qId => qId !== id))
    setXp(prev => Math.max(0, prev - reward))
  }

  const exportBacklog = () => {
    const lines = [
      '# Technical Debt Backlog',
      `_Exported on ${new Date().toLocaleString()}_\n`,
      '| Type | Severity | Category | File | Description | Effort | Impact |',
      '|---|---|---|---|---|---|---|'
    ];
    
    pendingDebt.forEach(item => {
      lines.push(`| ${item.type} | ${item.severity} | ${item.category} | \`${item.file}${item.line ? `:${item.line}` : ''}\` | ${item.message.replace(/\|/g, '-').replace(/\n/g, ' ')} | ${item.effort}/10 | ${item.impact}/10 |`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tech-debt-backlog-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const currentLevel = Math.floor(xp / 300) + 1
  const xpForNextLevel = currentLevel * 300
  const progressPercent = Math.min((xp / xpForNextLevel) * 100, 100)

  // Radar Chart calculation
  const radarData = useMemo(() => {
    const dimensions = {
      'Security': 100,
      'Code Quality': 100,
      'Maintainability': 100,
      'Architecture': 100,
      'Testing': 100
    }
    pendingDebt.forEach(item => {
      const penalty = item.impact * 2;
      if (item.category === 'Security' || item.category === 'Dependencies') dimensions['Security'] -= penalty;
      else if (item.category === 'Code Quality') dimensions['Code Quality'] -= penalty;
      else if (item.category === 'Architecture') dimensions['Architecture'] -= penalty;
      else dimensions['Maintainability'] -= penalty;
    })
    
    // Testing is inferred from overall health
    dimensions['Testing'] = analysis?.apiHealth || 70;

    // Bound values 0-100
    Object.keys(dimensions).forEach(k => {
      dimensions[k as keyof typeof dimensions] = Math.max(10, Math.min(100, dimensions[k as keyof typeof dimensions]))
    })
    return dimensions;
  }, [pendingDebt, analysis])

  const renderRadarChart = () => {
    const size = 400;
    const center = size / 2;
    const maxRadius = (size / 2) - 60;
    const keys = Object.keys(radarData);
    const angleStep = (Math.PI * 2) / keys.length;

    const getCoordinates = (value: number, index: number) => {
      const r = (value / 100) * maxRadius;
      const angle = index * angleStep - Math.PI / 2;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    }

    const points = keys.map((key, i) => {
      const coord = getCoordinates(radarData[key as keyof typeof radarData], i);
      return `${coord.x},${coord.y}`;
    }).join(' ');

    return (
      <div className="flex flex-col items-center justify-center py-12 px-8 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
        <h3 className="text-[var(--text-primary)] font-bold mb-12 flex items-center gap-2 text-xl font-sans tracking-wide">
          <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          System Health Radar
        </h3>
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Grid */}
          {[20, 40, 60, 80, 100].map(level => {
            const gridPoints = keys.map((_, i) => {
              const coord = getCoordinates(level, i);
              return `${coord.x},${coord.y}`;
            }).join(' ');
            return (
              <polygon key={level} points={gridPoints} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            )
          })}
          
          {/* Axes */}
          {keys.map((key, i) => {
            const coord = getCoordinates(100, i);
            return (
              <g key={`axis-${i}`}>
                <line x1={center} y1={center} x2={coord.x} y2={coord.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                <text 
                  x={coord.x + (coord.x > center ? 15 : coord.x < center ? -15 : 0)} 
                  y={coord.y + (coord.y > center ? 15 : coord.y < center ? -15 : 0)} 
                  fill="#94a3b8" 
                  fontSize="10" 
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="font-bold tracking-wider uppercase font-sans"
                >
                  {key}
                </text>
                <text 
                  x={coord.x + (coord.x > center ? 15 : coord.x < center ? -15 : 0)} 
                  y={coord.y + (coord.y > center ? 28 : coord.y < center ? -2 : 12)} 
                  fill="#fff" 
                  fontSize="12" 
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="font-bold font-sans"
                >
                  {radarData[key as keyof typeof radarData]}%
                </text>
              </g>
            )
          })}

          {/* Data Polygon */}
          <motion.polygon 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: 'spring' }}
            points={points} 
            fill="rgba(34, 211, 238, 0.2)" 
            stroke="#22d3ee" 
            strokeWidth="2" 
            style={{ transformOrigin: `${center}px ${center}px` }}
          />
        </svg>
      </div>
    )
  }

  const renderMatrix = () => {
    return (
      <div className="flex flex-col p-8 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] h-[600px]">
        <h3 className="text-[var(--text-primary)] font-bold mb-8 flex items-center gap-2 text-xl font-sans tracking-wide">
          <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Impact vs. Effort Matrix
        </h3>
        <div className="relative flex-1 border-l-2 border-b-2 border-[var(--border-color)] ml-8 mb-8">
          {/* Axis Labels */}
          <span className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest font-sans">Impact</span>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest font-sans">Effort</span>
          
          {/* Quadrant Lines */}
          <div className="absolute top-1/2 left-0 w-full border-t border-[var(--border-color)] border-dashed" />
          <div className="absolute top-0 left-1/2 h-full border-l border-[var(--border-color)] border-dashed" />
          
          {/* Quadrant Labels */}
          <span className="absolute top-4 left-4 text-[10px] font-bold text-green-500/50 uppercase tracking-widest font-sans">Quick Wins</span>
          <span className="absolute top-4 right-4 text-[10px] font-bold text-purple-500/50 uppercase tracking-widest font-sans">Major Projects</span>
          <span className="absolute bottom-4 left-4 text-[10px] font-bold text-[var(--text-secondary)]/50 uppercase tracking-widest font-sans">Fill-ins</span>
          <span className="absolute bottom-4 right-4 text-[10px] font-bold text-orange-500/50 uppercase tracking-widest font-sans">Thankless Tasks</span>

          {/* Plot Points */}
          <AnimatePresence>
            {pendingDebt.map(item => {
              // Normalize effort (1-10) to X (0-100%) and impact (1-10) to Y (100%-0%)
              // Add slight jitter so points don't perfectly overlap
              const jitterX = (Math.random() - 0.5) * 5;
              const jitterY = (Math.random() - 0.5) * 5;
              const x = Math.min(100, Math.max(0, ((item.effort / 10) * 100) + jitterX));
              const y = Math.min(100, Math.max(0, (100 - ((item.impact / 10) * 100)) + jitterY));
              
              const colorClass = SEVERITY_COLORS[item.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.info;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 cursor-help group shadow-[0_0_10px_currentColor] z-10 hover:z-20 ${colorClass}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 flex-col gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 rounded-lg shadow-2xl pointer-events-none">
                    <p className="text-[11px] font-bold text-[var(--text-primary)] font-sans uppercase tracking-wide truncate">{item.type}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-sans line-clamp-3 leading-relaxed">{item.message}</p>
                    <div className="flex justify-between items-center mt-1 border-t border-[var(--border-color)] pt-1.5">
                      <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Effort: {item.effort}</span>
                      <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Impact: {item.impact}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  const renderHistory = () => {
    const completedDebt = debtItems.filter(item => completedQuests.includes(item.id))

    return (
      <div className="flex flex-col p-8 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] h-[600px] overflow-y-auto">
        <h3 className="text-[var(--text-primary)] font-bold mb-8 flex items-center gap-2 text-xl font-sans tracking-wide sticky top-0 bg-[var(--bg-secondary)] backdrop-blur-sm z-10 py-2">
          <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Quest History
        </h3>
        
        {completedDebt.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] font-sans space-y-4">
            <History className="w-12 h-12 opacity-20" />
            <p>No quests completed yet. Get back to the board, hero!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {completedDebt.map((alert) => {
                const reward = getReward(alert.severity)
                const colorClass = SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.info

                return (
                  <motion.div 
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-panel p-4 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-secondary)]/20 grayscale-[0.5] opacity-80"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg border ${colorClass}`}>
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[var(--text-primary)] font-sans line-through decoration-slate-600">{alert.type} Quest</h4>
                        <p className="text-[10px] text-[var(--text-secondary)] font-sans mt-0.5 line-clamp-1">{alert.message}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-[var(--text-secondary)] font-mono">
                        +{reward} XP Earned
                      </span>
                      <button 
                        onClick={() => handleRedoQuest(alert.id, reward)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-indigo-600/20 border border-[var(--border-color)] hover:border-indigo-500/50 text-[var(--text-secondary)] hover:text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold font-sans transition-all"
                        title="Redo Quest"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Redo</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-[var(--text-primary)] text-left pb-10"
    >
      {/* Gamified Header / Player Card */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border-indigo-500/20">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none" />
        
        <div className="space-y-2 relative z-10 flex-1">
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase flex items-center space-x-1.5">
            <Flame className="w-4 h-4" />
            <span>GAMIFIED REFACTORING</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight font-sans">
            Tech Debt Radar
          </h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl leading-relaxed">
            Visualize your codebase health, prioritize technical debt, and level up your engineering skills by resolving quests.
          </p>
        </div>

        {/* Player Stats */}
        <div className="relative z-10 flex flex-col w-full md:w-72 shrink-0 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-[var(--text-primary)] font-bold font-sans text-sm">Hero Level {currentLevel}</span>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{xp} XP</span>
          </div>
          
          <div className="h-2.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] text-right mt-2 font-sans font-semibold">
            {xpForNextLevel - xp} XP to next level
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4 pt-2">
        {[
          { id: 'quests', label: 'Quest Board', icon: Sword },
          { id: 'radar', label: 'System Radar', icon: Target },
          { id: 'matrix', label: 'Debt Matrix', icon: Activity },
          { id: 'history', label: 'History', icon: History }
        ].map(view => {
          const Icon = view.icon
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all font-sans ${
                activeView === view.id 
                  ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          )
        })}
        <div className="flex-1" />
        <button
          onClick={exportBacklog}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all font-sans bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:border-slate-500 shadow-md"
        >
          <FileText className="w-4 h-4" />
          Export Backlog
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'radar' && renderRadarChart()}
          {activeView === 'matrix' && renderMatrix()}
          {activeView === 'history' && renderHistory()}
          {activeView === 'quests' && (
            pendingDebt.length === 0 ? (
              <div className="glass-panel p-16 text-center rounded-xl flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-[var(--text-primary)] font-bold text-2xl font-sans">All Quests Completed</h3>
                <p className="text-[var(--text-secondary)] text-sm font-sans max-w-md mx-auto leading-relaxed">Your codebase is remarkably clean! Excellent work, hero. Take a break or run another analysis later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <AnimatePresence>
                  {pendingDebt.map((alert) => {
                    const reward = getReward(alert.severity)
                    const colorClass = SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.info

                    return (
                      <motion.div 
                        key={alert.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                        className={`glass-panel p-6 rounded-xl border flex flex-col gap-4 transition-all hover:bg-[var(--bg-secondary)] shadow-lg ${colorClass.split(' ')[2]}`} // Use just the border color class for container
                      >
                        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${colorClass}`}>
                              {alert.category === 'Security' || alert.category === 'Dependencies' ? <ShieldCheck className="w-5 h-5" /> : <Code className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[var(--text-primary)] font-sans uppercase tracking-wide">{alert.type} Quest</h4>
                              <div className="text-[10px] flex items-center space-x-1.5 mt-1 opacity-90">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-yellow-400 font-bold">REWARD: +{reward} XP</span>
                                <span className="text-slate-600 font-bold">•</span>
                                <span className="text-[var(--text-secondary)] font-bold uppercase">{alert.category}</span>
                              </div>
                            </div>
                          </div>
                          {alert.githubUrl && (
                            <a href={alert.githubUrl} target="_blank" rel="noreferrer" className="text-[10px] px-2.5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors font-bold font-sans">
                              View Source
                            </a>
                          )}
                        </div>
                        
                        <p className="text-xs text-[var(--text-primary)] font-sans leading-relaxed min-h-[40px]">
                          {alert.message}
                        </p>
                        
                        <div className="mt-auto pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <code className="px-3 py-1.5 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] truncate max-w-full sm:max-w-[200px]">
                            {alert.file}{alert.line ? `:${alert.line}` : ''}
                          </code>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAcceptQuest(alert)}
                              className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg text-xs font-bold font-sans tracking-wide transition-all active:scale-95 text-center shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                            >
                              Accept Quest
                            </button>
                            <button 
                              onClick={() => handleCompleteQuest(alert.id, reward)}
                              className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-green-600/20 border border-[var(--border-color)] hover:border-green-500/50 text-[var(--text-primary)] hover:text-green-400 rounded-lg text-xs font-bold font-sans transition-all"
                              title="Mark as Done"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
