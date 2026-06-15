import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  ListTodo
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function SetupGuideTab() {
  const { setupSteps, runSetupStep } = useRepoStore()
  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  // Calculate stats
  const completedCount = setupSteps.filter(s => s.status === 'success').length
  const totalCount = setupSteps.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const toggleExpand = (id: number) => {
    setExpandedStep(expandedStep === id ? null : id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-slate-300 text-left"
    >
      {/* Progress Card header */}
      <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Abstract blue design glow */}
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="space-y-2 relative z-10 flex-1">
          <div className="text-xs text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <ListTodo className="w-3.5 h-3.5" />
            <span>LOCAL ENV CONFIG CHECKLIST</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            Environment Checklist
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl">
            Spin up database dependencies, install workspace packages, and launch local development sandboxes.
          </p>
        </div>

        {/* Circular Progress Indicator */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG Ring background */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#1F2937" strokeWidth="4" fill="transparent" />
              <circle 
                cx="32" cy="32" r="26" 
                stroke="#22D3EE" strokeWidth="4" fill="transparent" 
                strokeDasharray={163.36} 
                strokeDashoffset={163.36 - (163.36 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="text-xs">
            <div className="text-slate-400 font-sans">COMPLETED STEPS</div>
            <div className="text-sm font-bold text-cyan-400">{completedCount} of {totalCount} DONE</div>
          </div>
        </div>
      </div>

      {/* Checklist list */}
      <div className="space-y-4">
        {setupSteps.map((step, index) => {
          const isExpanded = expandedStep === step.id
          const isSuccess = step.status === 'success'
          const isRunning = step.status === 'running'
          const isPending = step.status === 'pending'

          return (
            <div 
              key={step.id} 
              className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 ${
                isExpanded ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.05)]' : ''
              }`}
            >
              {/* Card Title Trigger header */}
              <div 
                onClick={() => toggleExpand(step.id)}
                className={`p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 select-none transition-colors duration-200 ${
                  isRunning ? 'bg-blue-950/10' : ''
                }`}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Step status icon */}
                  <div className="shrink-0">
                    {isSuccess ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400 text-glow-cyan" />
                    ) : isRunning ? (
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold font-mono">
                        0{index + 1}
                      </div>
                    )}
                  </div>
                  
                  {/* Text labels */}
                  <div className="min-w-0">
                    <h3 className={`font-sans font-bold text-sm md:text-base leading-snug truncate ${
                      isSuccess ? 'text-slate-300 line-through decoration-slate-600' : 'text-white'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-slate-400 font-sans text-xs mt-0.5 truncate hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center space-x-4 ml-4">
                  {/* Quick trigger button */}
                  {isPending && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        runSetupStep(step.id)
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-400/50 hover:text-white rounded text-[10px] md:text-xs text-slate-300 font-bold tracking-wider flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-cyan-400" />
                      <span>RUN STEP</span>
                    </button>
                  )}

                  {isRunning && (
                    <span className="text-[10px] text-cyan-400 tracking-wider font-semibold animate-pulse">
                      EXECUTING...
                    </span>
                  )}

                  {isSuccess && (
                    <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider hidden md:inline-flex">
                      COMPLETE
                    </span>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Collapsed Terminal logs console */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-slate-900 bg-slate-950/90 font-mono text-xs overflow-hidden"
                  >
                    <div className="p-4 md:p-5 space-y-4">
                      {/* Code Execution Block */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">ONBOARD CMD</div>
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-slate-200">
                          <code className="text-cyan-400">{step.command}</code>
                          {isPending && (
                            <button
                              onClick={() => runSetupStep(step.id)}
                              className="text-cyan-400 hover:text-cyan-300 text-[10px] hover:underline"
                            >
                              Run Command
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Log Console Output Block */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">CONSOLE OUTPUT</div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-400 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
                          {isRunning ? (
                            <div className="flex items-center space-x-2 text-cyan-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span className="animate-pulse">Analyzing workspace configuration outputs...</span>
                            </div>
                          ) : isSuccess ? (
                            <div className="space-y-1">
                              <span className="text-green-400 font-bold">$ {step.command}</span>
                              <pre className="text-slate-300 whitespace-pre-wrap">{step.details}</pre>
                            </div>
                          ) : (
                            <span className="text-slate-600">Pending command dispatch execution logs.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
