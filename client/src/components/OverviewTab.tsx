import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  BarChart, 
  Files, 
  Network, 
  GitCommit,
  FlameKindling,
  Cpu,
  Boxes
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts'

import { useRepoStore } from '../store/useRepoStore'

export default function OverviewTab() {
  const { isAnalyzing, analysis } = useRepoStore()

  if (isAnalyzing || !analysis) {
    return (
      <div className="space-y-6 font-mono text-slate-300 text-left animate-pulse">
        {/* Skeleton content */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden bg-slate-950/20 h-36 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3.5 w-1/4 bg-slate-900 rounded skeleton-box" />
            <div className="h-6 w-1/3 bg-slate-900 rounded skeleton-box" />
          </div>
          <div className="h-3.5 w-2/3 bg-slate-900 rounded skeleton-box" />
        </div>
      </div>
    )
  }

  // Derive data from analysis
  const chartData = [
    { name: 'Routes', files: analysis.routes.length, complexity: analysis.routes.length * 10, size: analysis.routes.length * 15 },
    { name: 'Env Vars', files: analysis.envVars.length, complexity: analysis.envVars.length * 5, size: analysis.envVars.length * 2 },
    { name: 'APIs', files: analysis.apis.length, complexity: analysis.apis.length * 8, size: analysis.apis.length * 10 },
  ]

  // Add file roles to chart data if present
  const roleGroups = analysis.fileRoles.reduce((acc, file) => {
    acc[file.role] = (acc[file.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(roleGroups).forEach(([role, count]) => {
    chartData.push({ name: role, files: count, complexity: count * 5, size: count * 12 });
  });

  const stackData = analysis.apis.slice(0, 12).map((api, i) => {
    const colors = [
      'border-cyan-500 text-cyan-400',
      'border-blue-500 text-blue-400',
      'border-indigo-500 text-indigo-400',
      'border-green-500 text-green-400',
      'border-purple-500 text-purple-400',
      'border-orange-500 text-orange-400',
      'border-rose-500 text-rose-400'
    ];
    return { name: api.name || api.package, type: api.category || 'Dependency', color: colors[i % colors.length] };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-slate-300 text-left"
    >
      {/* Top Banner Dashboard Message */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Neon blue ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="text-xs text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI ANALYSIS DISPATCHED</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            {analysis.meta.repo}
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl">
            {analysis.summary.oneLiner}
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center">
            <span className="text-slate-500 font-normal">SCORE</span>
            <span className="text-green-400 font-bold text-sm">{analysis.onboardingScore.score}%</span>
          </div>
        </div>
      </div>

      {/* Metrics Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', val: analysis.summary.totalFiles.toString(), icon: Files, color: 'text-cyan-400' },
          { label: 'Mapped API Routes', val: analysis.routes.length.toString(), icon: Network, color: 'text-blue-400' },
          { label: 'Security Alerts', val: analysis.securityAlerts.length.toString(), icon: ShieldCheck, color: analysis.securityAlerts.length > 0 ? 'text-rose-400' : 'text-green-400' },
          { label: 'Latest Commit', val: analysis.meta.commitSha?.substring(0, 7) || 'N/A', icon: GitCommit, color: 'text-purple-400' }
        ].map((widget, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{widget.label}</span>
              <div className="text-2xl font-bold text-white tracking-tight font-sans">{widget.val}</div>
            </div>
            <div className={`p-2.5 rounded-lg bg-slate-950 border border-slate-850/60`}>
              <widget.icon className={`w-5 h-5 ${widget.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Complexity distribution */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <BarChart className="w-4.5 h-4.5 text-cyan-400" />
              <span className="font-semibold text-sm text-white font-sans">Project Size Overview</span>
            </div>
          </div>
          <div className="w-full h-64 font-sans text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6B7280" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
                <YAxis stroke="#6B7280" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1220', borderColor: '#1F2937', borderRadius: '8px', color: '#FFF' }}
                  labelStyle={{ fontWeight: 'bold', color: '#22D3EE' }}
                />
                <Area type="monotone" dataKey="size" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSize)" name="Size Proxy" />
                <Area type="monotone" dataKey="complexity" stroke="#22D3EE" fillOpacity={1} fill="url(#colorComp)" name="Complexity Proxy" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Directory File Densities */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4.5 h-4.5 text-blue-400" />
              <span className="font-semibold text-sm text-white font-sans">Module File Densities</span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase">FILE_COUNT</span>
          </div>
          <div className="w-full h-64 font-sans text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6B7280" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
                <YAxis stroke="#6B7280" tickLine={false} axisLine={false} style={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1220', borderColor: '#1F2937', borderRadius: '8px', color: '#FFF' }}
                  labelStyle={{ fontWeight: 'bold', color: '#3B82F6' }}
                />
                <Bar dataKey="files" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Files Count" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <FlameKindling className="w-4.5 h-4.5 text-purple-400" />
            <span className="font-semibold text-sm text-white font-sans">Tech Stack Profile</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase">DETECTED_LIBRARIES</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {stackData.map((tech, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg border ${tech.color} bg-slate-950/40 hover:bg-slate-900/60 transition-colors duration-200 flex flex-col items-center justify-center text-center space-y-1.5`}
            >
              <span className="font-sans font-bold text-xs truncate w-full">{tech.name}</span>
              <span className="text-[8px] text-slate-500 font-normal uppercase">{tech.type}</span>
            </div>
          ))}
          {stackData.length === 0 && (
            <div className="col-span-full text-center text-slate-500 text-xs py-4">No specific libraries detected or mapped in lookup table.</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
