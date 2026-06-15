import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileCode, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Info,
  Files
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function ImportantFilesTab() {
  const { importantFiles, searchQueryFiles, setSearchQueryFiles } = useRepoStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedImportance, setSelectedImportance] = useState<string>('All')
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  // Categories list
  const categories = ['All', 'Entrypoint', 'Config', 'Source']
  const importances = ['All', 'High', 'Medium', 'Low']

  // Filter files
  const filteredFiles = importantFiles.filter((file) => {
    const matchesSearch = file.path.toLowerCase().includes(searchQueryFiles.toLowerCase()) || 
                          file.purpose.toLowerCase().includes(searchQueryFiles.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory
    const matchesImportance = selectedImportance === 'All' || file.importance === selectedImportance

    return matchesSearch && matchesCategory && matchesImportance
  })

  const toggleExpand = (path: string) => {
    setExpandedFile(expandedFile === path ? null : path)
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
            <Files className="w-3.5 h-3.5" />
            <span>CRITICAL CODEBASE PATHS INDEX</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            Important Files
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-sans max-w-xl">
            Locate configurations, entry points, and state repositories immediately without routing through deep directories.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQueryFiles}
            onChange={(e) => setSearchQueryFiles(e.target.value)}
            placeholder="Search files by path or purpose..."
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 transition-all font-mono outline-none"
          />
        </div>

        {/* Category Filters */}
        <div className="lg:col-span-6 flex flex-wrap gap-2 items-center lg:justify-end">
          <div className="flex items-center space-x-2 text-slate-500 text-[10px] mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>FILTER:</span>
          </div>
          
          <div className="flex bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600/25 border border-blue-500/35 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg">
            {importances.map((imp) => (
              <button
                key={imp}
                onClick={() => setSelectedImportance(imp)}
                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                  selectedImportance === imp
                    ? 'bg-purple-950/20 border border-purple-500/35 text-purple-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {imp.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFiles.map((file) => {
          const isExpanded = expandedFile === file.path
          const importanceColors = {
            High: 'bg-red-500/10 border-red-500/25 text-red-400',
            Medium: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400',
            Low: 'bg-blue-500/10 border-blue-500/25 text-blue-400'
          }

          return (
            <div 
              key={file.path} 
              className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                isExpanded ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.05)] md:col-span-2' : 'hover:border-slate-700/80'
              }`}
            >
              {/* Card Trigger Block */}
              <div 
                onClick={() => toggleExpand(file.path)}
                className="p-5 flex items-start justify-between cursor-pointer hover:bg-slate-900/20 gap-4"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase ${importanceColors[file.importance]}`}>
                      {file.importance} Priority
                    </span>
                    <span className="px-2 py-0.5 border border-slate-800 bg-slate-950 text-slate-400 rounded text-[9px] font-bold uppercase">
                      {file.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileCode className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                    <code className="text-white text-xs md:text-sm font-semibold truncate block">
                      {file.path}
                    </code>
                  </div>
                  <p className="text-slate-400 font-sans text-xs line-clamp-2 leading-relaxed">
                    {file.purpose}
                  </p>
                </div>

                <div className="shrink-0 pt-1">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Extended Details pane */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-slate-900 bg-slate-950/80 font-sans overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      {/* Sub-explanation */}
                      <div className="space-y-1.5 font-mono">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center space-x-1">
                          <Info className="w-3 h-3 text-cyan-400" />
                          <span>ANALYZED RELEVANCE DETAILS</span>
                        </div>
                        <p className="text-slate-300 text-xs md:text-sm font-sans leading-relaxed">
                          {file.details}
                        </p>
                      </div>
                      
                      {/* Code Hint block */}
                      <div className="space-y-1.5 font-mono">
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">INGESTION_SECTOR</div>
                        <div className="bg-slate-900 border border-slate-850/60 p-3.5 rounded-lg text-slate-400 text-xs font-mono">
                          Module Tag: <span className="text-cyan-400">"{file.category.toLowerCase()}"</span> | File Size: <span className="text-purple-400">~{(file.path.length * 123) % 200 + 45} lines</span>
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

      {filteredFiles.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-xl text-slate-500 font-sans">
          No files match your query. Try adjusting your search filters.
        </div>
      )}
    </motion.div>
  )
}
