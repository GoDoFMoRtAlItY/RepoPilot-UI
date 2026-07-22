import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  KeyRound, 
  Copy, 
  Check, 
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Download,
  Database,
  Shield,
  Zap,
  Layers,
  FileCode,
  ChevronDown,
  ChevronUp,
  Search,
  ToggleLeft,
  ExternalLink
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

// Categorize env vars by name patterns
function categorizeEnvVar(name: string): { category: string, icon: typeof Database, color: string, description: string } {
  const n = name.toUpperCase()
  
  // Database
  if (n.includes('DB_') || n.includes('DATABASE') || n.includes('MONGO') || n.includes('POSTGRES') || 
      n.includes('MYSQL') || n.includes('REDIS') || n.includes('SQL') || n.includes('_URI') || n.includes('_DSN')) {
    return {
      category: 'Database',
      icon: Database,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/25',
      description: inferDescription(name, 'database')
    }
  }
  
  // Authentication & Security
  if (n.includes('SECRET') || n.includes('JWT') || n.includes('AUTH') || n.includes('SESSION') || 
      n.includes('PASSWORD') || n.includes('HASH') || n.includes('BCRYPT') || n.includes('OAUTH') ||
      n.includes('TOKEN') && !n.includes('API')) {
    return {
      category: 'Auth & Security',
      icon: Shield,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25',
      description: inferDescription(name, 'auth')
    }
  }
  
  // API Keys & External Services
  if (n.includes('API_KEY') || n.includes('API_SECRET') || n.includes('OPENAI') || n.includes('GEMINI') || 
      n.includes('STRIPE') || n.includes('TWILIO') || n.includes('SENDGRID') || n.includes('AWS') ||
      n.includes('FIREBASE') || n.includes('OPENROUTER') || n.includes('KEY') && n.includes('API')) {
    return {
      category: 'API Keys',
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
      description: inferDescription(name, 'api')
    }
  }
  
  // Server & Infrastructure
  if (n.includes('PORT') || n.includes('HOST') || n.includes('URL') || n.includes('ORIGIN') || 
      n.includes('CORS') || n.includes('NODE_ENV') || n.includes('ENV') || n.includes('DOMAIN') ||
      n.includes('BASE_URL') || n.includes('FRONTEND') || n.includes('BACKEND')) {
    return {
      category: 'Server Config',
      icon: Layers,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
      description: inferDescription(name, 'server')
    }
  }
  
  // Feature Flags
  if (n.includes('ENABLE_') || n.includes('DISABLE_') || n.includes('FEATURE_') || n.includes('FLAG_') ||
      n.includes('TOGGLE_') || n.includes('IS_') || n.includes('USE_')) {
    return {
      category: 'Feature Flags',
      icon: ToggleLeft,
      color: 'text-green-400 bg-green-500/10 border-green-500/25',
      description: inferDescription(name, 'feature')
    }
  }
  
  return {
    category: 'Other',
    icon: FileCode,
    color: 'text-[var(--text-secondary)] bg-slate-500/10 border-slate-500/25',
    description: inferDescription(name, 'other')
  }
}

// Infer human-readable descriptions based on env var name
function inferDescription(name: string, category: string): string {
  const n = name.toUpperCase()
  
  const descriptions: Record<string, string> = {
    // Database
    'MONGO_URI': 'MongoDB connection string for the primary database',
    'MONGODB_URI': 'MongoDB connection string for the primary database',
    'DATABASE_URL': 'Primary database connection URL (supports PostgreSQL, MySQL, etc.)',
    'DB_HOST': 'Database server hostname or IP address',
    'DB_PORT': 'Database server port number',
    'DB_NAME': 'Name of the database to connect to',
    'DB_USER': 'Database authentication username',
    'DB_PASSWORD': 'Database authentication password',
    'REDIS_URL': 'Redis cache/queue server connection URL',
    'REDIS_HOST': 'Redis server hostname',
    'REDIS_PORT': 'Redis server port (default: 6379)',
    
    // Auth
    'JWT_SECRET': 'Secret key for signing JSON Web Tokens — must be kept private',
    'SECRET': 'Application secret key for encryption and signing',
    'SESSION_SECRET': 'Secret for signing session cookies — generate a strong random value',
    'AUTH_SECRET': 'Authentication module secret key',
    'BCRYPT_ROUNDS': 'Number of bcrypt hashing rounds (higher = more secure but slower)',
    
    // API
    'GEMINI_API_KEY': 'Google Gemini AI API key from aistudio.google.com',
    'OPENROUTER_API_KEY': 'OpenRouter AI API key for model access',
    'OPENAI_API_KEY': 'OpenAI API key for GPT model access',
    'STRIPE_SECRET_KEY': 'Stripe payment processing secret key',
    'STRIPE_PUBLISHABLE_KEY': 'Stripe client-side publishable key (safe for frontend)',
    'AWS_ACCESS_KEY_ID': 'AWS IAM access key identifier',
    'AWS_SECRET_ACCESS_KEY': 'AWS IAM secret access key — keep private',
    'SENDGRID_API_KEY': 'SendGrid email service API key',
    'GITHUB_TOKEN': 'GitHub Personal Access Token for API authentication',
    
    // Server
    'PORT': 'Server listening port number',
    'HOST': 'Server hostname to bind to',
    'NODE_ENV': 'Node.js environment (development, production, test)',
    'CORS_ORIGIN': 'Allowed origins for Cross-Origin Resource Sharing',
    'BASE_URL': 'Base URL for the application',
    'FRONTEND_URL': 'URL of the frontend application',
    'API_BASE_URL': 'Base URL for API endpoints',
    
    // Feature
    'OPENROUTER_MODEL': 'AI model identifier for OpenRouter (e.g., gpt-4, claude-3)',
    'AI_PROVIDER': 'Which AI provider to use (gemini, openrouter, etc.)',
  }
  
  if (descriptions[n]) return descriptions[n]
  
  // Generate a description from the name pattern
  const words = name.replace(/_/g, ' ').toLowerCase()
  switch (category) {
    case 'database': return `Database configuration: ${words}`
    case 'auth': return `Authentication/security credential: ${words}`
    case 'api': return `External API key or credential: ${words}`
    case 'server': return `Server infrastructure setting: ${words}`
    case 'feature': return `Feature toggle: ${words}`
    default: return `Configuration value: ${words}`
  }
}

// Check if a value looks like a leaked secret
function isLeakedSecret(defaultValue: string | null): boolean {
  if (!defaultValue) return false
  const v = defaultValue.trim()
  // Skip common placeholder values
  if (['', 'your_', 'changeme', 'xxx', 'replace', 'placeholder', 'example', 'test'].some(p => v.toLowerCase().includes(p))) return false
  // Flag long alphanumeric strings that look like real keys
  if (v.length > 20 && /^[A-Za-z0-9_\-/+=.]+$/.test(v)) return true
  // Flag base64-like strings
  if (v.length > 30 && /^[A-Za-z0-9+/]+=*$/.test(v)) return true
  return false
}

export default function EnvVariablesTab() {
  const { analysis } = useRepoStore()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedVar, setExpandedVar] = useState<string | null>(null)

  // Build enriched env variables with categories and AI descriptions
  const envVariables = useMemo(() => {
    if (!analysis?.envVars) return []
    
    return analysis.envVars.map(v => {
      const cat = categorizeEnvVar(v.name)
      const leaked = isLeakedSecret(v.defaultValue)
      
      // Find all files that reference this env var
      const usedInFiles = analysis.files
        ?.filter(f => f.imports?.some(imp => imp.includes(v.name)) || false)
        .map(f => f.path) || []
      
      // Find routes that use this env var
      const usedInRoutes = analysis.routes
        ?.filter(r => r.usesEnvVars?.includes(v.name))
        .map(r => `${r.method} ${r.path}`) || []
      
      return {
        ...v,
        category: cat.category,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        aiDescription: cat.description,
        isLeaked: leaked,
        usedInFiles,
        usedInRoutes,
        status: (v.required ? 'missing' : 'optional-missing') as 'configured' | 'missing' | 'optional-missing'
      }
    })
  }, [analysis])

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    envVariables.forEach(v => {
      counts[v.category] = (counts[v.category] || 0) + 1
    })
    return counts
  }, [envVariables])

  // Filter variables
  const filteredVars = useMemo(() => {
    return envVariables.filter(v => {
      const matchesSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.aiDescription.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || v.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [envVariables, searchQuery, selectedCategory])

  const copyToClipboard = (text: string, key?: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key || text)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const downloadEnvFile = () => {
    const lines = envVariables.map(v => {
      const comment = `# ${v.aiDescription}`
      const requiredTag = v.required ? ' (REQUIRED)' : ''
      return `${comment}${requiredTag}\n${v.name}=${v.defaultValue || ''}`
    }).join('\n\n')
    
    const header = `# Environment Variables for ${analysis?.meta?.owner}/${analysis?.meta?.repo}\n# Generated by RepoPilot\n# ${new Date().toISOString()}\n\n`
    
    const blob = new Blob([header + lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env.example'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: 'configured' | 'missing' | 'optional-missing') => {
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
            <span>REQUIRED</span>
          </span>
        )
      case 'optional-missing':
        return (
          <span className="inline-flex items-center space-x-1 text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-bold uppercase font-mono">
            <HelpCircle className="w-2.5 h-2.5" />
            <span>OPTIONAL</span>
          </span>
        )
    }
  }

  const getBorderColor = (status: 'configured' | 'missing' | 'optional-missing', isLeaked: boolean) => {
    if (isLeaked) return 'border-red-500/50 hover:border-red-500/70 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]'
    switch (status) {
      case 'configured': return 'border-green-500/20 hover:border-green-500/40'
      case 'missing': return 'border-red-500/35 hover:border-red-500/50 shadow-[inset_0_0_10px_rgba(239,68,68,0.02)]'
      case 'optional-missing': return 'border-yellow-500/20 hover:border-yellow-500/40'
    }
  }

  const leakedCount = envVariables.filter(v => v.isLeaked).length
  const requiredCount = envVariables.filter(v => v.required).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-[var(--text-primary)] text-left"
    >
      {/* HUD Header */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>WORKSPACE ENVIRONMENT VARIABLE SCHEMAS</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans">
            Environment Variables
          </h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl">
            {envVariables.length} variables detected across {Object.keys(categoryCounts).length} categories. {requiredCount} required, {leakedCount > 0 ? `⚠️ ${leakedCount} potential secret leaks detected.` : 'no secret leaks detected.'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 relative z-10 shrink-0">
          <button
            onClick={downloadEnvFile}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-[var(--text-primary)] text-xs font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD .env</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variables..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-cyan-400 rounded-lg pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-slate-600 outline-none transition-colors font-mono"
          />
        </div>
        
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
              !selectedCategory 
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400' 
                : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
            }`}
          >
            All ({envVariables.length})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                selectedCategory === cat 
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400' 
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
              }`}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Leaked secrets warning */}
      {leakedCount > 0 && (
        <div className="glass-panel p-4 rounded-xl border-red-500/30 bg-red-500/5 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-400 font-sans">⚠️ Potential Secret Leak Detected</h3>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              {leakedCount} environment variable{leakedCount > 1 ? 's' : ''} appear to contain real credentials in the source code. 
              Ensure these values are not committed to version control. Add them to <code className="text-cyan-600 dark:text-cyan-400">.gitignore</code>.
            </p>
          </div>
        </div>
      )}

      {/* Env variables list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVars.map((variable) => {
          const isCopied = copiedKey === variable.name
          const isExpanded = expandedVar === variable.name
          const CategoryIcon = variable.categoryIcon

          return (
            <div 
              key={variable.name}
              className={`glass-panel rounded-xl border flex flex-col transition-all duration-300 relative ${getBorderColor(variable.status, variable.isLeaked)}`}
            >
              {/* Secret leak indicator stripe */}
              {variable.isLeaked && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
              )}
              
              <div className="p-5 space-y-3">
                {/* Header row: category badge + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 text-[8px] px-2 py-0.5 rounded border font-bold uppercase font-mono ${variable.categoryColor}`}>
                      <CategoryIcon className="w-2.5 h-2.5" />
                      <span>{variable.category}</span>
                    </span>
                    {variable.isLeaked && (
                      <span className="inline-flex items-center space-x-1 text-[8px] bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.5 rounded font-bold font-mono animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>LEAKED?</span>
                      </span>
                    )}
                  </div>
                  {getStatusBadge(variable.status)}
                </div>

                {/* Variable name */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <code className="text-[var(--text-primary)] text-xs md:text-sm font-bold truncate block">
                      {variable.name}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(variable.name)}
                    className="p-1 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-cyan-600 dark:text-cyan-400 cursor-pointer transition-colors"
                    title="Copy variable name"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* AI Description */}
                <p className="text-[var(--text-secondary)] font-sans text-xs leading-relaxed">
                  {variable.aiDescription}
                </p>

                {/* Default value preview */}
                <div className="space-y-1">
                  <div className="text-[8px] text-[var(--text-secondary)] uppercase tracking-widest">DEFAULT VALUE</div>
                  <div className="bg-[var(--bg-primary)] border border-slate-900 p-2.5 rounded text-[11px] text-[var(--text-primary)] truncate">
                    {variable.defaultValue ? (
                      <code className={variable.isLeaked ? 'text-red-400' : ''}>{variable.defaultValue}</code>
                    ) : (
                      <span className="text-slate-600 font-sans">No default value configured.</span>
                    )}
                  </div>
                </div>

                {/* Source file link */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[var(--text-secondary)] truncate">
                    📄 {variable.file}:{variable.line}
                  </span>
                  <button
                    onClick={() => setExpandedVar(isExpanded ? null : variable.name)}
                    className="text-[9px] text-[var(--text-secondary)] hover:text-cyan-600 dark:text-cyan-400 transition-colors flex items-center space-x-1"
                  >
                    <span>DETAILS</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-900 overflow-hidden"
                  >
                    <div className="p-4 space-y-3 bg-[var(--bg-primary)]">
                      {/* Cross-references */}
                      {variable.usedInRoutes.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest">USED IN ROUTES</span>
                          <div className="flex flex-wrap gap-1.5">
                            {variable.usedInRoutes.map((route, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                {route}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Source link */}
                      {variable.githubUrl && (
                        <a 
                          href={variable.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-3 py-1.5 border border-[var(--border-color)] hover:border-cyan-400 hover:text-cyan-600 dark:text-cyan-400 bg-[var(--bg-secondary)] rounded-lg text-[10px] font-bold transition-colors"
                        >
                          <span>View in GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {envVariables.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-xl text-[var(--text-secondary)] font-sans">
          No environment variables detected in the repository AST.
        </div>
      )}

      {filteredVars.length === 0 && envVariables.length > 0 && (
        <div className="glass-panel p-8 text-center rounded-xl text-[var(--text-secondary)] font-sans text-sm">
          No variables match your current filter. Try adjusting your search or category filter.
        </div>
      )}

      {/* Generated .env.example preview */}
      {envVariables.length > 0 && (
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <span className="font-semibold text-sm text-[var(--text-primary)] font-sans">Generated .env.example</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const text = envVariables.map(v => `# ${v.aiDescription}\n${v.name}=${v.defaultValue || ''}`).join('\n\n')
                  copyToClipboard(text, 'env_full')
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-cyan-400 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-colors cursor-pointer"
              >
                {copiedKey === 'env_full' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'env_full' ? 'COPIED' : 'COPY ALL'}</span>
              </button>
              <button
                onClick={downloadEnvFile}
                className="flex items-center space-x-1 px-3 py-1 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-cyan-400 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>DOWNLOAD</span>
              </button>
            </div>
          </div>
          <pre className="bg-[var(--bg-primary)] border border-slate-900 p-4 rounded-lg text-cyan-600 dark:text-cyan-400/80 text-[10px] md:text-[11px] overflow-x-auto whitespace-pre leading-relaxed select-text max-h-96 overflow-y-auto">
{envVariables.map(v => `# ${v.aiDescription}${v.required ? ' (REQUIRED)' : ''}\n${v.name}=${v.defaultValue || ''}`).join('\n\n')}
          </pre>
        </div>
      )}
    </motion.div>
  )
}
