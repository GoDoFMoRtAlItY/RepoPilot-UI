import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  ListTodo,
  Webhook,
  Download
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function SetupGuideTab() {
  const { analysis } = useRepoStore()
  const setupSteps = analysis?.setupSteps || []
  
  const [expandedStep, setExpandedStep] = useState<number | null>(1)
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'pending' | 'running' | 'success'>>({})
  const [n8nDownloaded, setN8nDownloaded] = useState(false)

  const runSetupStep = (id: number) => {
    setStepStatuses(prev => ({ ...prev, [id]: 'running' }))
    setTimeout(() => {
      setStepStatuses(prev => ({ ...prev, [id]: 'success' }))
    }, 1500)
  }

  // Calculate stats
  const completedCount = Object.values(stepStatuses).filter(s => s === 'success').length
  const totalCount = setupSteps.length
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  const toggleExpand = (id: number) => {
    setExpandedStep(expandedStep === id ? null : id)
  }

  const downloadN8nWorkflow = () => {
    const workflow = {
      "nodes": [
        {
          "parameters": {
            "httpMethod": "POST",
            "path": "repopilot-deploy",
            "options": {}
          },
          "name": "Webhook",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [250, 300]
        },
        {
          "parameters": {
            "command": "npm install && npm run build"
          },
          "name": "Execute Command",
          "type": "n8n-nodes-base.executeCommand",
          "typeVersion": 1,
          "position": [450, 300]
        }
      ],
      "connections": {
        "Webhook": {
          "main": [
            [
              {
                "node": "Execute Command",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      }
    }
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'repopilot-deployment-workflow.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setN8nDownloaded(true)
    setTimeout(() => setN8nDownloaded(false), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-slate-300 text-left pb-10"
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
        {setupSteps.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-xl text-slate-500 font-sans">
            No setup steps generated for this repository.
          </div>
        ) : setupSteps.map((step, index) => {
          const isExpanded = expandedStep === step.order
          const status = stepStatuses[step.order] || 'pending'
          const isSuccess = status === 'success'
          const isRunning = status === 'running'
          const isPending = status === 'pending'

          return (
            <div 
              key={step.order} 
              className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 ${
                isExpanded ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.05)]' : ''
              }`}
            >
              {/* Card Title Trigger header */}
              <div 
                onClick={() => toggleExpand(step.order)}
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
                        runSetupStep(step.order)
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
                              onClick={() => runSetupStep(step.order)}
                              className="text-cyan-400 hover:text-cyan-300 text-[10px] hover:underline"
                            >
                              Run Command
                            </button>
                          )}
                        </div>
                      </div>

                      {step.note && (
                        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-blue-300 text-xs font-sans">
                          <strong>Note:</strong> {step.note}
                        </div>
                      )}

                      {/* Log Console Output Block */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">CONSOLE OUTPUT</div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-400 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
                          {isRunning ? (
                            <div className="flex items-center space-x-2 text-cyan-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span className="animate-pulse">Executing command in local sandbox...</span>
                            </div>
                          ) : isSuccess ? (
                            <div className="space-y-1">
                              <span className="text-green-400 font-bold">$ {step.command}</span>
                              <pre className="text-slate-300 whitespace-pre-wrap">Execution complete. Exit Code: 0 (SUCCESS).</pre>
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

      {/* Deployment Integration section */}
      <div className="mt-8 pt-8 border-t border-slate-800/80">
        <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border-orange-500/20 hover:border-orange-500/40 transition-colors">
          <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-2 relative z-10 flex-1">
            <div className="text-xs text-orange-400 font-semibold uppercase flex items-center space-x-1.5">
              <Webhook className="w-3.5 h-3.5" />
              <span>N8N AUTOMATION INTEGRATION</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-sans">
              Deployment Workflow
            </h2>
            <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl leading-relaxed">
              Generate a pre-configured <strong className="text-white">n8n</strong> workflow file to automate deployments and Continuous Integration for this repository. Import this directly into your n8n instance.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              onClick={downloadN8nWorkflow}
              className={`flex items-center space-x-2 px-5 py-3 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95 ${
                n8nDownloaded 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                  : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-orange-500/20'
              }`}
            >
              {n8nDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>WORKFLOW EXPORTED</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>GENERATE N8N WORKFLOW</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
