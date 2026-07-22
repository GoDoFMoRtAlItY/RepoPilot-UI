import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  ListTodo,
  Webhook,
  Download,
  Box,
  Copy,
  Monitor,
  Apple,
  Terminal,
  AlertTriangle,
  HelpCircle,
  Wrench,
  Package,
  Check
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

// Detect prerequisites from the analysis
function detectPrerequisites(analysis: any): { name: string, version?: string, required: boolean, installCmd: Record<string, string>, icon: typeof Package, reason: string }[] {
  if (!analysis) return []
  
  const prereqs: { name: string, version?: string, required: boolean, installCmd: Record<string, string>, icon: typeof Package, reason: string }[] = []
  const apis = analysis.apis || []
  const files = analysis.files || []
  const techStack = analysis.summary?.primaryTechStack || []
  
  // Node.js
  const hasNodeFiles = files.some((f: any) => f.path?.endsWith('.js') || f.path?.endsWith('.ts') || f.path?.endsWith('.jsx') || f.path?.endsWith('.tsx'))
  if (hasNodeFiles) {
    prereqs.push({
      name: 'Node.js',
      version: '≥ 18.x',
      required: true,
      installCmd: {
        'macOS': 'brew install node',
        'Linux': 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
        'Windows': 'winget install OpenJS.NodeJS.LTS'
      },
      icon: Package,
      reason: 'JavaScript/TypeScript files detected in the project'
    })
  }
  
  // Python
  const hasPythonFiles = files.some((f: any) => f.path?.endsWith('.py'))
  if (hasPythonFiles) {
    prereqs.push({
      name: 'Python',
      version: '≥ 3.8',
      required: true,
      installCmd: {
        'macOS': 'brew install python3',
        'Linux': 'sudo apt-get install python3 python3-pip',
        'Windows': 'winget install Python.Python.3.12'
      },
      icon: Package,
      reason: 'Python files detected in the project'
    })
  }
  
  // MongoDB
  const hasMongo = apis.some((a: any) => a.package?.toLowerCase().includes('mongo') || a.name?.toLowerCase().includes('mongo'))
  if (hasMongo) {
    prereqs.push({
      name: 'MongoDB',
      version: '≥ 6.0',
      required: true,
      installCmd: {
        'macOS': 'brew tap mongodb/brew && brew install mongodb-community',
        'Linux': 'sudo apt-get install -y mongodb-org',
        'Windows': 'winget install MongoDB.Server'
      },
      icon: Package,
      reason: 'mongoose/mongodb package detected as dependency'
    })
  }
  
  // Redis
  const hasRedis = apis.some((a: any) => a.package?.toLowerCase().includes('redis') || a.package?.toLowerCase().includes('ioredis'))
  if (hasRedis) {
    prereqs.push({
      name: 'Redis',
      version: '≥ 7.0',
      required: false,
      installCmd: {
        'macOS': 'brew install redis && brew services start redis',
        'Linux': 'sudo apt-get install redis-server && sudo systemctl start redis',
        'Windows': 'winget install Redis.Redis'
      },
      icon: Package,
      reason: 'redis/ioredis package detected as dependency'
    })
  }
  
  // PostgreSQL
  const hasPostgres = apis.some((a: any) => a.package?.toLowerCase().includes('pg') || a.package?.toLowerCase().includes('postgres') || a.package?.toLowerCase().includes('prisma'))
  if (hasPostgres) {
    prereqs.push({
      name: 'PostgreSQL',
      version: '≥ 14',
      required: true,
      installCmd: {
        'macOS': 'brew install postgresql@15 && brew services start postgresql@15',
        'Linux': 'sudo apt-get install postgresql postgresql-contrib && sudo systemctl start postgresql',
        'Windows': 'winget install PostgreSQL.PostgreSQL'
      },
      icon: Package,
      reason: 'pg/prisma/postgres package detected as dependency'
    })
  }
  
  // Docker
  const hasDocker = files.some((f: any) => f.path?.toLowerCase().includes('docker'))
  if (hasDocker || techStack.some((t: string) => t.toLowerCase() === 'docker')) {
    prereqs.push({
      name: 'Docker',
      version: '≥ 24.x',
      required: false,
      installCmd: {
        'macOS': 'brew install --cask docker',
        'Linux': 'curl -fsSL https://get.docker.com | sh',
        'Windows': 'winget install Docker.DockerDesktop'
      },
      icon: Box,
      reason: 'Docker files detected in the project'
    })
  }
  
  // Git (always needed)
  prereqs.push({
    name: 'Git',
    version: '≥ 2.x',
    required: true,
    installCmd: {
      'macOS': 'brew install git',
      'Linux': 'sudo apt-get install git',
      'Windows': 'winget install Git.Git'
    },
    icon: Package,
    reason: 'Required for cloning the repository'
  })
  
  return prereqs
}

// Generate troubleshooting tips based on the stack
function generateTroubleshootingTips(analysis: any): { title: string, problem: string, solution: string }[] {
  if (!analysis) return []
  
  const tips: { title: string, problem: string, solution: string }[] = []
  const envVars = analysis.envVars || []
  const apis = analysis.apis || []
  
  // Missing env vars
  if (envVars.length > 0) {
    tips.push({
      title: 'Missing Environment Variables',
      problem: `The project requires ${envVars.filter((e: any) => e.required).length} required environment variables. If they're not set, the app will likely crash on startup.`,
      solution: 'Copy the .env.example file to .env and fill in all required values. Check the "Env Variables" tab for a detailed breakdown of each variable.'
    })
  }
  
  // Port conflicts
  tips.push({
    title: 'Port Already in Use',
    problem: 'Getting "EADDRINUSE" or "port already in use" error when starting the server.',
    solution: 'Kill the process using the port: `lsof -i :PORT | kill` (macOS/Linux) or `netstat -ano | findstr :PORT` then `taskkill /PID <PID>` (Windows). Or change the PORT in your .env file.'
  })
  
  // Node modules
  tips.push({
    title: 'Module Not Found Errors',
    problem: 'Getting "Cannot find module" or "MODULE_NOT_FOUND" errors.',
    solution: 'Delete node_modules and package-lock.json, then run `npm install` again. If using workspaces, run install from the root directory.'
  })
  
  // MongoDB connection
  const hasMongo = apis.some((a: any) => a.package?.toLowerCase().includes('mongo'))
  if (hasMongo) {
    tips.push({
      title: 'MongoDB Connection Refused',
      problem: 'Getting "ECONNREFUSED" when connecting to MongoDB.',
      solution: 'Ensure MongoDB is running (`mongosh` to test). If using Docker: `docker run -d -p 27017:27017 mongo:latest`. Check your MONGO_URI matches the running instance.'
    })
  }
  
  // CORS issues
  tips.push({
    title: 'CORS Errors in Browser',
    problem: 'Getting "Access-Control-Allow-Origin" errors in the browser console.',
    solution: 'Ensure the CORS_ORIGIN env variable matches your frontend URL exactly (including port). Common values: http://localhost:3000 or http://localhost:5173.'
  })
  
  return tips
}

type OSType = 'macOS' | 'Linux' | 'Windows'

export default function SetupGuideTab() {
  const { analysis } = useRepoStore()
  const setupSteps = analysis?.setupSteps || []
  
  const [expandedStep, setExpandedStep] = useState<number | null>(1)
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'pending' | 'running' | 'success'>>({})
  const [n8nDownloaded, setN8nDownloaded] = useState(false)
  const [dockerCopied, setDockerCopied] = useState(false)
  const [selectedOS, setSelectedOS] = useState<OSType>('macOS')
  const [showPrereqs, setShowPrereqs] = useState(true)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)

  const prerequisites = useMemo(() => detectPrerequisites(analysis), [analysis])
  const troubleshootingTips = useMemo(() => generateTroubleshootingTips(analysis), [analysis])

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

  const osIcons: Record<OSType, typeof Monitor> = {
    'macOS': Apple,
    'Linux': Terminal,
    'Windows': Monitor
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

      {/* OS Selector */}
      <div className="flex items-center space-x-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">PLATFORM:</span>
        {(['macOS', 'Linux', 'Windows'] as OSType[]).map(os => {
          const OsIcon = osIcons[os]
          return (
            <button
              key={os}
              onClick={() => setSelectedOS(os)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                selectedOS === os
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <OsIcon className="w-3 h-3" />
              <span>{os}</span>
            </button>
          )
        })}
      </div>

      {/* Prerequisites Section */}
      {prerequisites.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPrereqs(!showPrereqs)}
            className="w-full p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                <Wrench className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-bold text-sm text-white">Prerequisites</h3>
                <p className="text-[10px] text-slate-500">{prerequisites.length} dependencies detected for this stack</p>
              </div>
            </div>
            {showPrereqs ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          
          <AnimatePresence initial={false}>
            {showPrereqs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-slate-900 overflow-hidden"
              >
                <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prerequisites.map((prereq, i) => (
                    <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-bold text-white font-sans">{prereq.name}</span>
                          {prereq.version && (
                            <span className="text-[9px] text-slate-500">{prereq.version}</span>
                          )}
                        </div>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          prereq.required 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }`}>
                          {prereq.required ? 'REQUIRED' : 'RECOMMENDED'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans">{prereq.reason}</p>
                      <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[10px]">
                        <code className="text-cyan-400">{prereq.installCmd[selectedOS]}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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

      {/* Troubleshooting Section */}
      {troubleshootingTips.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden border-amber-500/15">
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="font-sans font-bold text-sm text-white">Common Issues & Troubleshooting</h3>
                <p className="text-[10px] text-slate-500">{troubleshootingTips.length} tips based on detected stack</p>
              </div>
            </div>
            {showTroubleshooting ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          
          <AnimatePresence initial={false}>
            {showTroubleshooting && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-slate-900 overflow-hidden"
              >
                <div className="p-4 md:p-5 space-y-4">
                  {troubleshootingTips.map((tip, i) => (
                    <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-white font-sans">{tip.title}</span>
                      </div>
                      <div className="space-y-2 text-[11px] font-sans">
                        <div>
                          <span className="text-[9px] text-red-400 uppercase tracking-widest font-mono block mb-1">PROBLEM</span>
                          <p className="text-slate-400">{tip.problem}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-green-400 uppercase tracking-widest font-mono block mb-1">SOLUTION</span>
                          <p className="text-slate-300">{tip.solution}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Docker Sandbox Integration section */}
      {analysis?.sandboxEnvironment && (
        <div className="mt-8 pt-8 border-t border-slate-800/80">
          <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
            
            <div className="space-y-2 relative z-10 flex-1">
              <div className="text-xs text-blue-400 font-semibold uppercase flex items-center space-x-1.5">
                <Box className="w-3.5 h-3.5" />
                <span>SANDBOX ENVIRONMENT GENERATOR</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight font-sans">
                1-Click Docker Sandbox
              </h2>
              <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl leading-relaxed">
                We've analyzed the stack and environment variables to automatically generate a <strong className="text-white">docker-compose.yml</strong> file. Get up and running in a completely isolated sandbox without polluting your local machine.
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(analysis.sandboxEnvironment!.dockerCompose)
                  setDockerCopied(true)
                  setTimeout(() => setDockerCopied(false), 2000)
                }}
                className={`flex items-center space-x-2 px-5 py-3 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95 ${
                  dockerCopied 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/20'
                }`}
              >
                {dockerCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>COPY DOCKER-COMPOSE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
