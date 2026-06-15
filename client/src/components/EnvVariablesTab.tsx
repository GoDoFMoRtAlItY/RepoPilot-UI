import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  KeyRound, 
  Copy, 
  Check, 
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react'
import { useRepoStore, type EnvVariable } from '../store/useRepoStore'

export default function EnvVariablesTab() {
  const { envVariables } = useRepoStore()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(text)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const getStatusBadge = (status: EnvVariable['status']) => {
    switch (status) {
      case 'configured':
        return (
          <span className="inline-flex items-center space-x-1 text-[8px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase font-mono">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>CONFIGURED</span>
          </span>
        )
      case 'missing':
        return (
          <span className="inline-flex items-center space-x-1 text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold uppercase font-mono animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>REQUIRED MISSING</span>
          </span>
        )
      case 'optional-missing':
        return (
          <span className="inline-flex items-center space-x-1 text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-bold uppercase font-mono">
            <HelpCircle className="w-2.5 h-2.5" />
            <span>OPTIONAL MISSING</span>
          </span>
        )
    }
  }

  const getBorderColor = (status: EnvVariable['status']) => {
    switch (status) {
      case 'configured': return 'border-green-500/20 hover:border-green-500/40'
      case 'missing': return 'border-red-500/35 hover:border-red-500/50 shadow-[inset_0_0_10px_rgba(239,68,68,0.02)]'
      case 'optional-missing': return 'border-yellow-500/20 hover:border-yellow-500/40'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-slate-300 text-left"
    >
      {/* HUD Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="text-xs text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>WORKSPACE ENVIRONMENT VARIABLE SCHEMAS</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            Environment Variables
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl">
            Validate environment keys to verify local database and API integrations have valid access codes.
          </p>
        </div>
      </div>

      {/* Env variables list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {envVariables.map((variable) => {
          const isCopied = copiedKey === variable.name

          return (
            <div 
              key={variable.name}
              className={`glass-panel p-5 rounded-xl border flex flex-col justify-between gap-5 transition-all duration-300 relative ${getBorderColor(variable.status)}`}
            >
              <div className="space-y-3">
                {/* Header status */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(variable.status)}
                  <span className="text-[8px] text-slate-500 tracking-wider">
                    {variable.required ? 'REQUIRED' : 'OPTIONAL'}
                  </span>
                </div>

                {/* Variable name */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <code className="text-white text-xs md:text-sm font-bold truncate block">
                      {variable.name}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(variable.name)}
                    className="p-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors"
                    title="Copy variable name"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Description */}
                <p className="text-slate-400 font-sans text-xs leading-relaxed">
                  {variable.description}
                </p>
              </div>

              {/* Default value preview */}
              <div className="space-y-1">
                <div className="text-[8px] text-slate-500 uppercase tracking-widest">DEFAULT VALUE / FORMAT</div>
                <div className="bg-slate-950 border border-slate-900 p-2.5 rounded text-[11px] text-slate-300 truncate">
                  {variable.defaultValue ? (
                    <code>{variable.defaultValue}</code>
                  ) : (
                    <span className="text-slate-600 font-sans">No default value configured.</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick .env.example projection block */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="font-semibold text-sm text-white font-sans">Generated .env.example</span>
          <button
            onClick={() => {
              const text = envVariables.map(v => `${v.name}=${v.defaultValue || ''}`).join('\n')
              copyToClipboard(text)
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400 text-[10px] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            {copiedKey === 'env_full' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === 'env_full' ? 'COPIED' : 'COPY ALL'}</span>
          </button>
        </div>
        <pre className="bg-slate-950 border border-slate-900 p-4 rounded-lg text-cyan-400/80 text-[10px] md:text-[11px] overflow-x-auto whitespace-pre leading-relaxed select-text">
{envVariables.map(v => `# ${v.description}\n${v.name}=${v.defaultValue || ''}`).join('\n\n')}
        </pre>
      </div>
    </motion.div>
  )
}
