import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ShieldCheck, 
  BarChart, 
  Files, 
  Network, 
  GitCommit,
  FlameKindling,
  Cpu,
  Boxes,
  Lightbulb,
  Sparkles,
  TrendingUp,
  ExternalLink
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
import RepositorySnapshot from './RepositorySnapshot'

export default function OverviewTab() {
  const { isAnalyzing, analysis, error } = useRepoStore()
  const navigate = useNavigate()

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 font-sans space-y-3">
        <h2 className="text-lg font-bold flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-rose-500" />
          <span>Repository Analysis Failed</span>
        </h2>
        <p className="text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border-color)]">{error}</p>
        <p className="text-xs text-[var(--text-secondary)]">Please verify that the repository is public and the URL is correct, or try again later.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold tracking-wide transition-all border border-rose-500/30"
        >
          Try Another Repository
        </button>
      </div>
    )
  }

  if (isAnalyzing || !analysis) {
    return (
      <div className="space-y-6 font-mono text-[var(--text-primary)] text-left animate-pulse">
        {/* Skeleton content */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden h-36 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-3.5 w-1/4 bg-[var(--bg-secondary)] rounded skeleton-box" />
            <div className="h-6 w-1/3 bg-[var(--bg-secondary)] rounded skeleton-box" />
          </div>
          <div className="h-3.5 w-2/3 bg-[var(--bg-secondary)] rounded skeleton-box" />
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
      'border-cyan-500 text-cyan-600 dark:text-cyan-400',
      'border-blue-500 text-blue-600 dark:text-blue-400',
      'border-indigo-500 text-indigo-600 dark:text-indigo-400',
      'border-green-500 text-green-400',
      'border-purple-500 text-purple-600 dark:text-purple-400',
      'border-orange-500 text-orange-400',
      'border-rose-500 text-rose-600 dark:text-rose-400'
    ];
    return { name: api.name || api.package, type: api.category || 'Dependency', color: colors[i % colors.length] };
  });

  // --- Tech Stack Suggestion Engine ---
  // Maps detected technologies to suggested complementary technologies
  const techSuggestionMap: Record<string, { name: string; reason: string; tags: string[]; priority: number }[]> = {
    'express': [
      { name: 'NestJS', reason: 'Enterprise-grade Node.js framework with built-in TypeScript support, DI, and modular architecture — great next step from Express', tags: ['Backend', 'TypeScript'], priority: 3 },
      { name: 'Fastify', reason: 'High-performance alternative to Express with schema-based validation and 2x faster throughput', tags: ['Backend', 'Performance'], priority: 2 },
      { name: 'GraphQL', reason: 'Flexible query language that pairs well with Express for building efficient, typed APIs', tags: ['API', 'Query Language'], priority: 2 },
    ],
    'react': [
      { name: 'Next.js', reason: 'Full-stack React framework with SSR, API routes, and file-based routing used by most production React apps', tags: ['Full-Stack', 'SSR'], priority: 3 },
      { name: 'React Query / TanStack Query', reason: 'Powerful data-fetching and caching library that eliminates boilerplate in React apps', tags: ['State Management', 'Data Fetching'], priority: 3 },
      { name: 'Zustand / Jotai', reason: 'Lightweight state management alternatives to Redux — simpler mental model, smaller bundle', tags: ['State Management'], priority: 1 },
    ],
    'typescript': [
      { name: 'Zod', reason: 'Runtime schema validation that pairs perfectly with TypeScript for end-to-end type safety', tags: ['Validation', 'Type Safety'], priority: 3 },
      { name: 'tRPC', reason: 'End-to-end typesafe APIs without code generation — connect your TS frontend and backend seamlessly', tags: ['API', 'Full-Stack'], priority: 2 },
    ],
    'tailwindcss': [
      { name: 'Radix UI', reason: 'Unstyled, accessible component primitives that combine perfectly with Tailwind for custom design systems', tags: ['UI', 'Accessibility'], priority: 2 },
      { name: 'Framer Motion', reason: 'Production-ready animation library for React that brings interfaces to life', tags: ['Animation', 'UX'], priority: 2 },
    ],
    'vite': [
      { name: 'Vitest', reason: 'Blazing-fast unit testing framework built on Vite — shares config, supports ESM natively', tags: ['Testing', 'DX'], priority: 3 },
      { name: 'Playwright', reason: 'Modern end-to-end testing framework by Microsoft — cross-browser, reliable, widely adopted', tags: ['Testing', 'E2E'], priority: 2 },
    ],
    'mongodb': [
      { name: 'PostgreSQL', reason: 'Industry-standard relational database — learning SQL unlocks most enterprise and startup stacks', tags: ['Database', 'SQL'], priority: 3 },
      { name: 'Prisma', reason: 'Next-generation ORM with auto-generated types and migrations — works with any SQL database', tags: ['ORM', 'Database'], priority: 3 },
      { name: 'Redis', reason: 'In-memory data store for caching, sessions, and real-time features — essential for scaling', tags: ['Caching', 'Performance'], priority: 2 },
    ],
    'mongoose': [
      { name: 'Prisma', reason: 'Modern ORM with excellent TypeScript integration and support for PostgreSQL, MySQL, and MongoDB', tags: ['ORM', 'Database'], priority: 3 },
      { name: 'PostgreSQL', reason: 'Relational database knowledge is essential — most production systems use SQL under the hood', tags: ['Database', 'SQL'], priority: 3 },
    ],
    'axios': [
      { name: 'SWR', reason: 'React hook for data fetching with built-in caching, revalidation, and focus tracking', tags: ['Data Fetching', 'React'], priority: 2 },
      { name: 'tRPC', reason: 'Type-safe API calls without REST boilerplate when using TypeScript on both ends', tags: ['API', 'TypeScript'], priority: 2 },
    ],
    'cors': [
      { name: 'Auth.js (NextAuth)', reason: 'Authentication framework that handles OAuth, JWT, sessions — essential for secured APIs', tags: ['Auth', 'Security'], priority: 3 },
      { name: 'Passport.js', reason: 'Flexible authentication middleware with 500+ strategies for Express apps', tags: ['Auth', 'Middleware'], priority: 2 },
    ],
    'dotenv': [
      { name: 'Docker', reason: 'Containerization ensures consistent environments across dev/staging/prod — industry standard', tags: ['DevOps', 'Deployment'], priority: 3 },
      { name: 'GitHub Actions', reason: 'CI/CD pipelines automate testing and deployment — a must-know for modern development', tags: ['CI/CD', 'DevOps'], priority: 3 },
    ],
    'socket.io': [
      { name: 'WebRTC', reason: 'Peer-to-peer communication for video, audio, and data channels — builds on real-time skills', tags: ['Real-time', 'P2P'], priority: 2 },
    ],
    'jest': [
      { name: 'Vitest', reason: 'Faster Jest alternative that shares Vite config and supports ESM natively', tags: ['Testing', 'DX'], priority: 2 },
      { name: 'Cypress / Playwright', reason: 'E2E testing complements unit testing for comprehensive test coverage', tags: ['Testing', 'E2E'], priority: 2 },
    ],
    'redux': [
      { name: 'Zustand', reason: 'Simpler state management with less boilerplate — growing fast in the React ecosystem', tags: ['State Management', 'React'], priority: 2 },
    ],
    'firebase': [
      { name: 'Supabase', reason: 'Open-source Firebase alternative with PostgreSQL, auth, and real-time — more portable skills', tags: ['BaaS', 'Database'], priority: 2 },
    ],
    'jsonwebtoken': [
      { name: 'Auth.js (NextAuth)', reason: 'Higher-level auth framework that handles JWT, sessions, and OAuth providers out of the box', tags: ['Auth', 'Security'], priority: 2 },
    ],
    'helmet': [
      { name: 'OWASP Top 10', reason: 'Understanding web security fundamentals makes you invaluable on any team', tags: ['Security', 'Knowledge'], priority: 3 },
      { name: 'Rate Limiting (express-rate-limit)', reason: 'Protect APIs from abuse — essential security practice for production apps', tags: ['Security', 'API'], priority: 2 },
    ],
  };

  // Build suggestions from detected tech stack
  const detectedTechNames = new Set(
    [
      ...analysis.apis.map(a => (a.name || a.package || '').toLowerCase()),
      ...(analysis.summary.primaryTechStack || []).map(t => t.toLowerCase())
    ]
  );

  const suggestionsMap = new Map<string, { name: string; reason: string; tags: string[]; priority: number; triggeredBy: string[] }>();

  detectedTechNames.forEach(tech => {
    const key = tech.replace(/[^a-z0-9.-]/g, '');
    const suggestions = techSuggestionMap[key] || [];
    suggestions.forEach(s => {
      // Don't suggest something already in the stack
      if (detectedTechNames.has(s.name.toLowerCase())) return;
      const existing = suggestionsMap.get(s.name);
      if (existing) {
        existing.triggeredBy.push(tech);
        existing.priority = Math.max(existing.priority, s.priority);
      } else {
        suggestionsMap.set(s.name, { ...s, triggeredBy: [tech] });
      }
    });
  });

  const techSuggestions = Array.from(suggestionsMap.values())
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);

  const priorityColors: Record<number, { border: string; bg: string; badge: string; text: string }> = {
    3: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-400' },
    2: { border: 'border-blue-500/40', bg: 'bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300', text: 'text-blue-400' },
    1: { border: 'border-slate-500/40', bg: 'bg-slate-500/5', badge: 'bg-slate-500/20 text-slate-300', text: 'text-slate-400' },
  };

  const priorityLabels: Record<number, string> = { 3: 'HIGH IMPACT', 2: 'RECOMMENDED', 1: 'NICE TO KNOW' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-[var(--text-primary)] text-left"
    >
      <RepositorySnapshot />

      {/* Top Banner Dashboard Message */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Neon blue ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[var(--accent-primary)]/10 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="text-xs text-[var(--accent-primary)] font-semibold uppercase flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI ANALYSIS DISPATCHED</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans">
            {analysis.meta.repo}
          </h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl">
            {analysis.summary.oneLiner}
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col items-center">
            <span className="text-[var(--text-secondary)] font-normal">SCORE</span>
            <span className="text-[var(--accent-secondary)] font-bold text-sm">{analysis.onboardingScore.score}%</span>
          </div>
        </div>
      </div>

      {/* Metrics Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', val: analysis.summary.totalFiles.toString(), icon: Files, color: 'text-[var(--accent-primary)]' },
          { label: 'Mapped API Routes', val: analysis.routes.length.toString(), icon: Network, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Security Alerts', val: analysis.securityAlerts.length.toString(), icon: ShieldCheck, color: analysis.securityAlerts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--accent-secondary)]' },
          { label: 'Latest Commit', val: analysis.meta.commitSha?.substring(0, 7) || 'N/A', icon: GitCommit, color: 'text-purple-600 dark:text-purple-400' }
        ].map((widget, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{widget.label}</span>
              <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans">{widget.val}</div>
            </div>
            <div className={`p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]`}>
              <widget.icon className={`w-5 h-5 ${widget.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Complexity distribution */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <BarChart className="w-4.5 h-4.5 text-[var(--accent-primary)]" />
              <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">Project Size Overview</span>
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
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">Module File Densities</span>
            </div>
            <span className="text-[9px] text-[var(--text-secondary)] uppercase">FILE_COUNT</span>
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
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center space-x-2">
            <FlameKindling className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">Tech Stack Profile</span>
          </div>
          <span className="text-[9px] text-[var(--text-secondary)] uppercase">DETECTED_LIBRARIES</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {stackData.map((tech, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg border ${tech.color} bg-[var(--bg-secondary)] hover:bg-[var(--glass-hover-bg)] transition-colors duration-200 flex flex-col items-center justify-center text-center space-y-1.5`}
            >
              <span className="font-sans font-bold text-xs truncate w-full">{tech.name}</span>
              <span className="text-[8px] text-[var(--text-secondary)] font-normal uppercase">{tech.type}</span>
            </div>
          ))}
          {stackData.length === 0 && (
            <div className="col-span-full text-center text-[var(--text-secondary)] text-xs py-4">No specific libraries detected or mapped in lookup table.</div>
          )}
        </div>
      </div>

      {/* Tech Stack Suggestions */}
      {techSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel p-5 rounded-xl space-y-5 relative overflow-hidden"
        >
          {/* Ambient background glow */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-radial from-emerald-500/8 via-transparent to-transparent rounded-full pointer-events-none blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-radial from-blue-500/6 via-transparent to-transparent rounded-full pointer-events-none blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">Tech Stack Suggestions</span>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Based on your current stack — technologies that will boost your skills across more projects</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">AI_RECOMMENDED</span>
            </div>
          </div>

          {/* Suggestion Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
            {techSuggestions.map((suggestion, i) => {
              const colors = priorityColors[suggestion.priority] || priorityColors[1];
              return (
                <motion.div
                  key={suggestion.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`group p-4 rounded-lg border ${colors.border} ${colors.bg} hover:bg-[var(--glass-hover-bg)] transition-all duration-300 cursor-default relative overflow-hidden`}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--text-primary)]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10 space-y-2.5">
                    {/* Top row: Name + Priority Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <TrendingUp className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
                        <span className="font-sans font-bold text-sm text-[var(--text-primary)] truncate">{suggestion.name}</span>
                      </div>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${colors.badge}`}>
                        {priorityLabels[suggestion.priority]}
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                      {suggestion.reason}
                    </p>

                    {/* Bottom row: Tags + Triggered By + YouTube Tutorial Link */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)] mt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {suggestion.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-[9px] text-[var(--text-tertiary)] font-mono truncate max-w-[90px]" title={`Because you use: ${suggestion.triggeredBy.join(', ')}`}>
                          via {suggestion.triggeredBy[0]}
                        </span>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(suggestion.name + ' tutorial for beginners')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-sans font-semibold transition-all hover:scale-105"
                          title={`Watch ${suggestion.name} tutorial on YouTube`}
                        >
                          <svg className="w-3 h-3 text-rose-500 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          <span>Learn</span>
                          <ExternalLink className="w-2.5 h-2.5 text-rose-400 opacity-70 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer insight */}
          <div className="flex items-center space-x-2 pt-2 border-t border-[var(--border-color)] relative z-10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <p className="text-[10px] text-[var(--text-secondary)] font-sans">
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{techSuggestions.filter(s => s.priority === 3).length} high-impact</span> suggestions identified from {detectedTechNames.size} detected technologies — prioritized by cross-project relevance.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
