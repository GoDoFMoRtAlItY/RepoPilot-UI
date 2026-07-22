/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileCode, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  GitBranch, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  FolderOpen
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'


interface ExplorerFile {
  fileName: string
  path: string
  folder: string
  size: number
  sha: string
  description?: string
  loading?: boolean
  error?: boolean
}

const mapToExplorerFiles = (files: any[]): ExplorerFile[] => {
  return files.map(f => {
    const parts = f.path.split('/')
    parts.pop()
    const folder = parts.length > 0 ? parts.join('/') : '📄 Root Files'
    return {
      fileName: f.filename || f.fileName,
      path: f.path,
      folder,
      size: f.size,
      sha: f.sha,
      description: f.description
    }
  })
}



export default function ImportantFilesTab() {
  const { analysis } = useRepoStore()
  
  // URL Input
  const defaultUrl = analysis 
    ? `https://github.com/${analysis.meta.owner}/${analysis.meta.repo}`
    : ''
  const [repoUrl, setRepoUrl] = useState(defaultUrl)
  
  // Explorer States
  const [isTreeLoading, setIsTreeLoading] = useState(false)
  const [explorerError, setExplorerError] = useState<string | null>(null)
  const [owner, setOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [defaultBranch, setDefaultBranch] = useState('')
  const [commitSha, setCommitSha] = useState('')
  const [files, setFiles] = useState<ExplorerFile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Card toggle states
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  // Auto-run if there is an active analysis
  useEffect(() => {
    if (analysis && files.length === 0 && !isTreeLoading) {
      setOwner(analysis.meta.owner)
      setRepoName(analysis.meta.repo)
      setDefaultBranch(analysis.meta.defaultBranch)
      setCommitSha(analysis.meta.commitSha)
      setFiles(mapToExplorerFiles(analysis.files || []))
    }
  }, [analysis])

  const handleExplore = async (urlToExplore?: string) => {
    const targetUrl = urlToExplore || repoUrl
    if (!targetUrl.trim()) return

    const match = targetUrl.trim().replace(/\/$/, "").match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      setExplorerError('Invalid GitHub URL format. Please use https://github.com/owner/repo')
      return;
    }

    const [, newOwner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    if (analysis && analysis.meta.owner === newOwner && analysis.meta.repo === cleanRepo) {
      setOwner(analysis.meta.owner)
      setRepoName(analysis.meta.repo)
      setDefaultBranch(analysis.meta.defaultBranch)
      setCommitSha(analysis.meta.commitSha)
      setFiles(mapToExplorerFiles(analysis.files || []))
      return;
    }

    setIsTreeLoading(true)
    setExplorerError(null)
    setFiles([])

    try {
      await useRepoStore.getState().analyzeRepo(newOwner, cleanRepo)
      const updatedAnalysis = useRepoStore.getState().analysis
      if (updatedAnalysis) {
        setOwner(updatedAnalysis.meta.owner)
        setRepoName(updatedAnalysis.meta.repo)
        setDefaultBranch(updatedAnalysis.meta.defaultBranch)
        setCommitSha(updatedAnalysis.meta.commitSha)
        setFiles(mapToExplorerFiles(updatedAnalysis.files || []))
      }
    } catch (err: any) {
      console.error(err)
      setExplorerError('An unexpected error occurred while analyzing.')
    } finally {
      setIsTreeLoading(false)
    }
  }

  // Filtered files list based on search
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const q = searchQuery.toLowerCase()
      const matchesName = f.fileName.toLowerCase().includes(q)
      const matchesFolder = f.folder.toLowerCase().includes(q)
      const matchesDesc = (f.description || '').toLowerCase().includes(q)
      return matchesName || matchesFolder || matchesDesc
    })
  }, [files, searchQuery])

  // Build a recursive tree from filteredFiles
  const fileTree = useMemo(() => {
    const root: Record<string, any> = { name: 'Root', type: 'folder', children: {}, path: '' }
    
    // Explicitly add '📄 Root Files' to ensure it renders first or specifically
    const rootFilesNode: any = { name: '📄 Root Files', type: 'folder', children: {}, path: '📄 Root Files', isRootFiles: true }
    root.children['📄 Root Files'] = rootFilesNode;

    filteredFiles.forEach(f => {
      if (f.folder === '📄 Root Files') {
        rootFilesNode.children[f.fileName] = { type: 'file', fileData: f, name: f.fileName, path: f.path }
      } else {
        const parts = f.folder.split('/')
        let current = root
        parts.forEach((part, index) => {
          if (!part) return;
          if (!current.children[part]) {
            current.children[part] = { 
              name: part, 
              type: 'folder', 
              children: {}, 
              path: parts.slice(0, index + 1).join('/') 
            }
          }
          current = current.children[part]
        })
        current.children[f.fileName] = { type: 'file', fileData: f, name: f.fileName, path: f.path }
      }
    })

    // If no root files, remove the node
    if (Object.keys(rootFilesNode.children).length === 0) {
      delete root.children['📄 Root Files']
    }

    return root
  }, [filteredFiles])

  // File type icons
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />
      case 'js':
      case 'jsx':
        return <FileCode className="w-5 h-5 text-yellow-400 shrink-0" />
      case 'json':
        return <FileCode className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
      case 'md':
        return <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      default:
        return <FileCode className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
    }
  }

  // Recursive Folder Component
  const FolderNode = ({ node, level = 0 }: { node: any, level?: number }) => {
    const [isOpen, setIsOpen] = useState(true)

    // Sort children: folders first, then files
    const childrenNodes = Object.values(node.children || {}).sort((a: any, b: any) => {
      if (a.type === 'folder' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })

    const folderFiles = childrenNodes.filter((c: any) => c.type === 'file')
    const folderFolders = childrenNodes.filter((c: any) => c.type === 'folder')

    if (node.name === 'Root') {
      return (
        <div className="space-y-4">
          {childrenNodes.map((child: any) => (
            child.type === 'folder' 
              ? <FolderNode key={child.path} node={child} level={0} /> 
              : null // files at absolute root are already in 📄 Root Files
          ))}
        </div>
      )
    }

    return (
      <div className={`space-y-3.5 ${level > 0 ? 'ml-6 border-l border-[var(--border-color)] pl-4' : ''}`}>
        <div 
          className="flex items-center space-x-2 text-[var(--text-secondary)] border-b border-slate-900 pb-2 cursor-pointer hover:text-cyan-600 dark:text-cyan-400 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FolderOpen className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400/80" />
          <span className="text-sm font-bold text-slate-200 tracking-wide font-sans">{node.name}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                {/* Render subfolders recursively */}
                {folderFolders.map((subFolder: any) => (
                  <FolderNode key={subFolder.path} node={subFolder} level={level + 1} />
                ))}
                
                {/* Render files in a 2-column grid */}
                {folderFiles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {folderFiles.map((child: any) => {
                      const file = child.fileData
                      const isExpanded = expandedFile === file.path;
                      
                      return (
                        <div
                          key={file.path}
                          onClick={() => setExpandedFile(isExpanded ? null : file.path)}
                          className={`glass-panel p-4.5 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between border-slate-850 hover:border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] hover:shadow-[0_0_15px_rgba(6,182,212,0.02)] ${
                            isExpanded ? 'border-cyan-500/30 ring-1 ring-cyan-500/10' : ''
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                {getFileIcon(file.fileName)}
                                <span className="text-[var(--text-primary)] text-xs font-bold truncate tracking-wide">{file.fileName}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 shrink-0">
                                <span className="text-[9px] text-[var(--text-secondary)] uppercase font-mono tracking-wider bg-[var(--bg-secondary)] border border-slate-850 px-1.5 py-0.5 rounded">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                )}
                              </div>
                            </div>

                            <div className="text-[10px] text-[var(--text-secondary)] truncate font-mono">
                              {file.path}
                            </div>

                            <div className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed min-h-[32px]">
                              {file.loading ? (
                                <div className="space-y-1.5 animate-pulse">
                                  <div className="h-3 bg-[var(--bg-secondary)]/80 rounded w-full" />
                                  <div className="h-3 bg-[var(--bg-secondary)]/80 rounded w-2/3 mt-2" />
                                  <span className="text-cyan-600 dark:text-cyan-500/70 text-[10px] mt-1 block">Generating AI explanation...</span>
                                </div>
                              ) : (
                                file.error ? "AI explanation could not be generated for this file." : file.description
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3.5 pt-3.5 border-t border-slate-900 font-sans text-xs text-[var(--text-secondary)]"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex flex-col gap-2">
                                    <a
                                      href={`https://github.com/${owner}/${repoName}/blob/${defaultBranch}/${file.path}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-2 bg-[var(--bg-secondary)] hover:bg-slate-850 text-center border border-[var(--border-color)] hover:border-cyan-500/30 text-[10px] font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)] rounded transition-all block tracking-wider"
                                    >
                                      VIEW SOURCE ON GITHUB
                                    </a>
                                    <a
                                      href={`/repo/${owner}/${repoName}/analyze?path=${encodeURIComponent(file.path)}&sha=${file.sha}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-2 bg-cyan-950/30 hover:bg-cyan-900/40 text-center border border-cyan-800/50 hover:border-cyan-500/80 text-[10px] font-bold text-cyan-300 hover:text-cyan-100 rounded transition-all block tracking-wider"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      DETAILED ANALYSIS
                                    </a>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 font-mono text-[var(--text-primary)] text-left"
    >
      {/* Header HUD */}
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-80 h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>EXTERNAL RESOURCE EXPLORER</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-sans">
            GitHub Repository Explorer
          </h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-xl">
            Browse directory structures and view AI-generated descriptions for public repositories instantly, without local checkouts.
          </p>
        </div>
      </div>

      {/* URL Paste Input */}
      <div className="glass-panel p-5 rounded-xl border-[var(--border-color)] bg-[var(--bg-primary)]">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleExplore(); }}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste public GitHub URL (e.g., https://github.com/vercel/next.js)..."
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--border-color)] focus:border-cyan-400 rounded-lg pl-11 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 transition-all font-mono outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isTreeLoading}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-[var(--bg-secondary)] disabled:text-[var(--text-secondary)] text-[var(--text-primary)] rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)] disabled:shadow-none"
          >
            {isTreeLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>INDEXING...</span>
              </>
            ) : (
              <>
                <span>EXPLORE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {explorerError && (
          <div className="mt-3.5 p-3.5 bg-red-950/20 border border-red-500/25 rounded-lg flex items-center space-x-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{explorerError}</span>
          </div>
        )}
      </div>

      {/* Loading HUD or Summary Progress */}
      {isTreeLoading && (
        <div className="glass-panel p-12 text-center rounded-xl flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin" />
          <div className="space-y-1 font-sans">
            <h4 className="text-[var(--text-primary)] text-sm font-semibold">Fetching remote file tree...</h4>
            <p className="text-[var(--text-secondary)] text-xs">Accessing GitHub API. Please wait.</p>
          </div>
        </div>
      )}

      {/* Progress & Search & Filter panel */}
      {files.length > 0 && !isTreeLoading && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files by name, folder or description..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--border-color)] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 transition-all font-mono outline-none"
              />
            </div>



            <div className="flex items-center space-x-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] px-3.5 py-2 rounded-lg">
                <GitBranch className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Branch: <strong className="text-[var(--text-primary)]">{defaultBranch}</strong></span>
                <span className="text-slate-700">|</span>
                <span>SHA: <code className="text-[var(--text-secondary)] text-[10px]">{commitSha.substring(0, 7)}</code></span>
              </div>
          </div>

          {/* Tree Rendering */}
          <div className="space-y-8">
            <FolderNode node={fileTree} />
          </div>

          {filteredFiles.length === 0 && (
            <div className="glass-panel p-12 text-center rounded-xl text-[var(--text-secondary)] font-sans">
              No files matched your search parameters.
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
