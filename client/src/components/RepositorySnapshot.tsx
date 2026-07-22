import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Check, ShieldCheck, Lightbulb, Play } from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function RepositorySnapshot() {
  const { analysis, aiSummary, aiSummaryError, isAiSummaryLoading } = useRepoStore()

  if (!analysis) return null

  const { summary, entryPoint, setupSteps = [] } = analysis

  const projectType = summary?.projectType || "Unknown Project"
  const architectureType = summary?.architectureType || "Unknown Architecture"
  const primaryTechStack = summary?.primaryTechStack || []
  const complexity = summary?.complexity || "Unknown"
  const onboardingTime = summary?.onboardingTime || "Unknown"
  const projectMaturity = summary?.projectMaturity || []
  const quickInsights = summary?.quickInsights || []

  return (
    <div className="space-y-4 mb-8">
      {/* 1. Main Header / Overview */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950/90 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none blur-3xl" />
        
        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
          
          {/* Left Column: Core Identity */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {projectType}
                </span>
                <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {architectureType}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-sans tracking-tight mb-2">
                Executive Summary
              </h2>
              <div className="text-sm text-slate-300 font-sans leading-relaxed border-l-2 border-indigo-500/50 pl-3 min-h-[40px] flex items-center">
                {isAiSummaryLoading ? (
                  <div className="flex items-center space-x-2 text-slate-400 italic">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Generating onboarding summary...</span>
                  </div>
                ) : aiSummary ? (
                  <p>{aiSummary}</p>
                ) : (
                  <p className="italic text-rose-400/80">{aiSummaryError || 'Repository insight unavailable.'}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Primary Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {primaryTechStack.map((tech, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 shadow-sm flex items-center shadow-slate-950/50"
                  >
                    {tech}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Setup */}
          <div className="lg:w-80 flex flex-col space-y-4">
            
            {/* Complexity & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Complexity</span>
                <span className={`font-bold text-sm ${complexity === 'Enterprise' || complexity === 'Large' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {complexity}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> Onboarding</span>
                <span className="font-bold text-sm text-amber-400">
                  {onboardingTime}
                </span>
              </div>
            </div>

            {/* Entry Point */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 group hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center">
                  <Play className="w-3 h-3 mr-1" /> Primary Entry Point
                </span>
              </div>
              <a 
                href={entryPoint?.githubUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm font-mono text-cyan-400 hover:text-cyan-300 truncate block bg-slate-900 p-2 rounded border border-slate-800"
                title={entryPoint?.file || 'N/A'}
              >
                {entryPoint?.file || 'N/A'}
              </a>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Developer Starting Guide */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 md:col-span-1 flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Developer Starting Guide
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start text-xs font-sans text-slate-300">
              <Check className="w-3.5 h-3.5 mr-2 text-emerald-500 mt-0.5 shrink-0" />
              <span>Read README</span>
            </li>
            {setupSteps.map((step, i) => (
              <li key={i} className="flex items-start text-xs font-sans text-slate-300">
                <Check className="w-3.5 h-3.5 mr-2 text-emerald-500 mt-0.5 shrink-0" />
                <span className="break-all">{step.title}</span>
              </li>
            ))}
            <li className="flex items-start text-xs font-sans text-slate-300">
              <Check className="w-3.5 h-3.5 mr-2 text-emerald-500 mt-0.5 shrink-0" />
              <span>Explore Architecture Graph</span>
            </li>
          </ul>
        </div>

        {/* Project Maturity */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 md:col-span-1">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-500" /> Project Maturity
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {projectMaturity.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-950 p-2 rounded-md border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">{item.check}</span>
                {item.status === 'Present' || item.status === 'Configured' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800/80 bg-slate-900/50 md:col-span-1 max-h-64 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 flex items-center">
            <Lightbulb className="w-4 h-4 mr-1.5 text-amber-500" /> Quick Insights
          </h3>
          <ul className="space-y-2.5">
            {quickInsights.map((insight, i) => (
              <li key={i} className="flex items-start text-xs font-sans text-slate-300 leading-tight bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 mr-2 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
