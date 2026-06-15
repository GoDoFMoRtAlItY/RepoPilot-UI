import { motion } from 'framer-motion'
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldBan,
  FileCode,
  ExternalLink
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function SecurityTab() {
  const { analysis } = useRepoStore()
  const alerts = analysis?.securityAlerts || []

  const highAlerts = alerts.filter(a => a.severity === 'high')
  const mediumAlerts = alerts.filter(a => a.severity === 'medium')
  const lowAlerts = alerts.filter(a => a.severity === 'low')

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high': return <ShieldBan className="w-4 h-4 text-red-400" />
      case 'medium': return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case 'low': return <ShieldAlert className="w-4 h-4 text-yellow-400" />
      default: return <ShieldAlert className="w-4 h-4 text-slate-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]'
      case 'medium': return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      case 'low': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
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
        <div className="space-y-2 relative z-10 flex-1">
          <div className="text-xs text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>VULNERABILITY SCANNER</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            Security Audit
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl">
            Static analysis of code blocks to detect potential hardcoded secrets, injection flaws, and security misconfigurations.
          </p>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 flex space-x-2 shrink-0">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-slate-900 border-slate-800 w-20">
            <span className="text-[10px] text-slate-500 font-bold mb-1">HIGH</span>
            <span className="text-xl font-black text-red-400">{highAlerts.length}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-slate-900 border-slate-800 w-20">
            <span className="text-[10px] text-slate-500 font-bold mb-1">MED</span>
            <span className="text-xl font-black text-orange-400">{mediumAlerts.length}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-slate-900 border-slate-800 w-20">
            <span className="text-[10px] text-slate-500 font-bold mb-1">LOW</span>
            <span className="text-xl font-black text-yellow-400">{lowAlerts.length}</span>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-xl flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-green-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold text-lg font-sans">Zero Vulnerabilities Detected</h3>
            <p className="text-slate-400 text-sm font-sans max-w-md mx-auto">
              The static analyzer did not find any hardcoded credentials or common security misconfigurations in the codebase.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {alerts.map((alert, idx) => (
            <div 
              key={idx}
              className={`glass-panel p-5 rounded-xl border flex flex-col md:flex-row md:items-start gap-4 transition-all ${getSeverityColor(alert.severity)}`}
            >
              <div className="shrink-0 mt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="font-bold text-sm text-white font-sans truncate">{alert.type}</h4>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit tracking-wide border ${getSeverityColor(alert.severity)} bg-transparent`}>
                    {alert.severity} SEVERITY
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {alert.message}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <code className="text-[10px] md:text-xs font-semibold text-slate-400 truncate">
                      {alert.file}{alert.line ? `:${alert.line}` : ''}
                    </code>
                  </div>
                  {alert.githubUrl && (
                    <a 
                      href={alert.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex items-center space-x-1.5 px-2.5 py-1 rounded border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-400 bg-slate-900 transition-colors shrink-0 text-[10px] font-bold"
                    >
                      <span>INSPECT</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
