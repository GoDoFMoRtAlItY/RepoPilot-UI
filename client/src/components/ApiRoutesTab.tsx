import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, 
  Search, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  Compass,
  Layers
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function ApiRoutesTab() {
  const { apiRoutes, searchQueryApis, setSearchQueryApis } = useRepoStore()
  const [selectedMethod, setSelectedMethod] = useState<string>('All')
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  const methods = ['All', 'GET', 'POST', 'PUT', 'DELETE']

  const filteredRoutes = apiRoutes.filter((route) => {
    const matchesSearch = route.path.toLowerCase().includes(searchQueryApis.toLowerCase()) || 
                          route.description.toLowerCase().includes(searchQueryApis.toLowerCase())
    const matchesMethod = selectedMethod === 'All' || route.method === selectedMethod

    return matchesSearch && matchesMethod
  })

  const methodColors = {
    GET: 'bg-green-500/10 border-green-500/30 text-green-400',
    POST: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    PUT: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    DELETE: 'bg-red-500/10 border-red-500/30 text-red-400'
  }

  const toggleExpand = (path: string) => {
    setExpandedRoute(expandedRoute === path ? null : path)
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
            <Terminal className="w-3.5 h-3.5" />
            <span>DISCOVERED APPLICATION ROUTING RULES</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            APIs & Routes
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl">
            Audit cataloged server endpoints, request scopes, authentication guards, and middleware validation sequences.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search */}
        <div className="lg:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQueryApis}
            onChange={(e) => setSearchQueryApis(e.target.value)}
            placeholder="Search API endpoints by path or description..."
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 transition-all font-mono outline-none"
          />
        </div>

        {/* Method filter buttons */}
        <div className="lg:col-span-6 flex flex-wrap gap-2 items-center lg:justify-end">
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] mr-1">
            <Compass className="w-3.5 h-3.5" />
            <span>METHODS:</span>
          </div>
          
          <div className="flex bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                  selectedMethod === m
                    ? 'bg-blue-600/25 border border-blue-500/35 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Discovered endpoints lists */}
      <div className="space-y-3">
        {filteredRoutes.map((route) => {
          const isExpanded = expandedRoute === route.path
          const mColor = methodColors[route.method] || 'bg-slate-500/10 text-slate-400 border-slate-700'

          return (
            <div 
              key={route.path} 
              className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 ${
                isExpanded ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.05)]' : 'hover:border-slate-800'
              }`}
            >
              {/* Endpoint card trigger header */}
              <div 
                onClick={() => toggleExpand(route.path)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/20 gap-4"
              >
                <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                  {/* Method tag */}
                  <span className={`px-2.5 py-1 border rounded font-bold text-[10px] tracking-wide shrink-0 ${mColor}`}>
                    {route.method}
                  </span>
                  
                  {/* Endpoint path and auth tag */}
                  <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-1">
                    <code className="text-white text-xs md:text-sm font-semibold truncate block">
                      {route.path}
                    </code>
                    {route.auth ? (
                      <span className="inline-flex items-center text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase w-fit">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Auth Protected
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[8px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase w-fit">
                        <Unlock className="w-2.5 h-2.5 mr-1" />
                        Public Endpoint
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 ml-4">
                  <span className="text-[10px] text-slate-500 hidden md:block max-w-sm truncate">
                    {route.description}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Collapsed breakdown panel */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-slate-900 bg-slate-950/80 font-mono text-xs overflow-hidden"
                  >
                    <div className="p-4 md:p-5 space-y-4">
                      {/* Description */}
                      <div className="space-y-1">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">ENDPOINT SCOPE</div>
                        <p className="text-slate-300 font-sans text-xs md:text-sm">
                          {route.description}
                        </p>
                      </div>

                      {/* Middleware validation */}
                      <div className="space-y-2">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center space-x-1">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          <span>MIDDLEWARE PIPELINE stack</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded">corsCheck()</span>
                          <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded">bodyLimit(50mb)</span>
                          {route.auth && (
                            <span className="bg-red-950/10 border border-red-900/30 text-red-400 px-2.5 py-1 rounded font-bold">sessionGuard()</span>
                          )}
                          <span className="bg-blue-950/10 border border-blue-900/30 text-cyan-400 px-2.5 py-1 rounded">rateLimiter(100/min)</span>
                        </div>
                      </div>

                      {/* Parameters breakdown */}
                      <div className="space-y-2">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">REQUEST PARAMETERS</div>
                        <div className="bg-slate-900 border border-slate-850/60 p-3 rounded-lg">
                          {route.parameters.length > 0 ? (
                            <div className="divide-y divide-slate-850/50">
                              {route.parameters.map((param) => (
                                <div key={param} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                                  <code className="text-cyan-400 text-[11px] font-bold">{param}</code>
                                  <span className="text-[9px] text-slate-500">Query / Body Parameter</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">None required for this endpoint.</span>
                          )}
                        </div>
                      </div>

                      {/* Boilerplate fetch snippet */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center space-x-1">
                          <Code2 className="w-3 h-3 text-cyan-400" />
                          <span>REQUEST BOILERPLATE</span>
                        </div>
                        <pre className="bg-slate-900 border border-slate-850 p-4 rounded-lg text-slate-300 font-mono text-[10px] md:text-[11px] overflow-x-auto whitespace-pre leading-relaxed">
{`const response = await fetch('${route.path}'${route.method !== 'GET' ? `, {
  method: '${route.method}',
  headers: {
    'Content-Type': 'application/json'${route.auth ? `,
    'Authorization': 'Bearer <YOUR_SESSION_TOKEN>'` : ''}
  }${route.parameters.length > 0 ? `,
  body: JSON.stringify({
    ${route.parameters.map(p => `${p}: ''`).join(',\n    ')}
  })` : ''}
}` : ''});`}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-xl text-slate-500 font-sans">
          No routing paths match your filter options.
        </div>
      )}
    </motion.div>
  )
}
