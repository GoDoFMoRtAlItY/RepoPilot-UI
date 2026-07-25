/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  FileCode,
  Box,
  BoxSelect,
  X,
  Workflow,
  ExternalLink,
  Database,
  Shield,
  Layers,
  Cog,
  Route,
  Globe,
  ChevronRight,
  Layers2,
  List,
  LayoutDashboard,
  Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dagre from '@dagrejs/dagre'
import { useRepoStore } from '../store/useRepoStore'
import {
  summarizeGraph,
  CATEGORY_COLORS,
  type GroupNode,
  type GroupCategory,
} from '../lib/graphSummarizer'

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewMode = 'overview' | 'detailed'

// ─── Detailed-mode color palette (unchanged from original) ──────────────────
const ROLE_COLORS: Record<string, { bg: string; border: string; accent: string; text: string; glow: string }> = {
  route:      { bg: 'bg-[#0a1628]', border: 'border-cyan-500/40',   accent: 'bg-cyan-400',   text: 'text-cyan-600 dark:text-cyan-400',   glow: 'shadow-[0_0_8px_rgba(34,211,238,0.15)]' },
  controller: { bg: 'bg-[#0a1628]', border: 'border-cyan-500/40',   accent: 'bg-cyan-400',   text: 'text-cyan-600 dark:text-cyan-400',   glow: 'shadow-[0_0_8px_rgba(34,211,238,0.15)]' },
  middleware:  { bg: 'bg-[#1a0f28]', border: 'border-orange-500/40', accent: 'bg-orange-400', text: 'text-orange-400',                    glow: 'shadow-[0_0_8px_rgba(249,115,22,0.15)]'  },
  model:      { bg: 'bg-[#0f1628]', border: 'border-purple-500/40', accent: 'bg-purple-400', text: 'text-purple-600 dark:text-purple-400',glow: 'shadow-[0_0_8px_rgba(168,85,247,0.15)]'  },
  service:    { bg: 'bg-[#0f1a1a]', border: 'border-green-500/40',  accent: 'bg-green-400',  text: 'text-green-400',                     glow: 'shadow-[0_0_8px_rgba(74,222,128,0.15)]'  },
  config:     { bg: 'bg-[#1a1a0f]', border: 'border-yellow-500/40', accent: 'bg-yellow-400', text: 'text-yellow-400',                    glow: 'shadow-[0_0_8px_rgba(250,204,21,0.15)]'  },
  util:       { bg: 'bg-[var(--surface-card)]', border: 'border-slate-500/40',  accent: 'bg-slate-400',  text: 'text-[var(--text-secondary)]',  glow: '' },
  test:       { bg: 'bg-[var(--surface-card)]', border: 'border-indigo-500/40', accent: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', glow: '' },
  entry:      { bg: 'bg-[#0f1a28]', border: 'border-blue-500/50',   accent: 'bg-blue-400',   text: 'text-blue-600 dark:text-blue-400',   glow: 'shadow-[0_0_12px_rgba(59,130,246,0.25)]' },
  directory:  { bg: 'bg-[var(--surface-card)]', border: 'border-slate-600/40',  accent: 'bg-slate-500',  text: 'text-[var(--text-secondary)]',  glow: '' },
  system:     { bg: 'bg-[#0a1628]', border: 'border-blue-500/40',   accent: 'bg-blue-400',   text: 'text-blue-600 dark:text-blue-400',   glow: 'shadow-[0_0_8px_rgba(59,130,246,0.15)]'  },
  default:    { bg: 'bg-[var(--surface-card)]', border: 'border-[var(--border-color)]', accent: 'bg-cyan-400', text: 'text-[var(--text-primary)]', glow: '' },
}

function getNodeIcon(type: string) {
  switch (type) {
    case 'route': case 'controller': return Route
    case 'middleware': return Shield
    case 'model': return Database
    case 'service': return Cog
    case 'config': return Layers
    case 'entry': return Globe
    case 'directory': return Box
    case 'system': return BoxSelect
    default: return FileCode
  }
}

function getCategoryIcon(category: GroupCategory) {
  switch (category) {
    case 'frontend': return LayoutDashboard
    case 'backend':  return Layers2
    case 'services': return Cog
    case 'data':     return Database
    case 'external': return Globe
    default:         return Box
  }
}

function getLayer(type: string): number {
  switch (type) {
    case 'entry':      return 0
    case 'route': case 'controller': return 1
    case 'middleware': return 2
    case 'service':    return 3
    case 'model':      return 4
    case 'config':     return 5
    case 'util':       return 6
    case 'test':       return 7
    default:           return 3
  }
}

// ─── Dagre layout helper ────────────────────────────────────────────────────
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB',
  nodeWidth = 240,
  nodeHeight = 80,
  ranksep = 100,
  nodesep = 80,
) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, ranksep, nodesep, edgesep: 30 })
  nodes.forEach(n => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  const isH = direction === 'LR'
  nodes.forEach(n => {
    const p = g.node(n.id)
    n.targetPosition = isH ? Position.Left  : Position.Top
    n.sourcePosition = isH ? Position.Right : Position.Bottom
    n.position = { x: p.x - nodeWidth / 2, y: p.y - nodeHeight / 2 }
  })
  return { nodes, edges }
}

// ─── Edge labelling helpers ─────────────────────────────────────────────────
function inferEdgeLabel(srcType: string, tgtType: string, explicit?: string): string {
  if (explicit && explicit !== 'depends') return explicit
  const pair = `${srcType}->${tgtType}`
  switch (pair) {
    case 'entry->route': case 'entry->controller': return 'registers'
    case 'route->middleware': case 'controller->middleware': return 'uses middleware'
    case 'route->service': case 'controller->service': return 'calls'
    case 'route->model': case 'controller->model': return 'queries'
    case 'service->model': return 'reads/writes'
    case 'middleware->service': return 'validates via'
    case 'model->config': case 'service->config': return 'configured by'
    case 'route->util': case 'service->util': return 'uses'
    default: return explicit || 'imports'
  }
}

function getEdgeColor(label: string): string {
  if (label.includes('middleware') || label.includes('validates')) return '#f97316'
  if (label.includes('queries') || label.includes('reads') || label.includes('writes')) return '#a855f7'
  if (label.includes('calls')) return '#22d3ee'
  if (label.includes('registers')) return '#3b82f6'
  if (label.includes('configured')) return '#eab308'
  return '#3B82F6'
}

// ════════════════════════════════════════════════════════════════════════════
// DETAILED MODE — HUD Node Component (same as original)
// ════════════════════════════════════════════════════════════════════════════
interface DetailedNodeData extends Record<string, unknown> {
  label: string
  status: string
  icon: any
  type: string
  details: string
  specifications: Record<string, string>
  githubUrl?: string
  roleColors: typeof ROLE_COLORS['default']
  layer: number
  isFocused?: boolean
}

function HudNodeComponent({ data }: NodeProps) {
  const d = data as DetailedNodeData
  const Icon = d.icon
  const colors = d.roleColors

  return (
    <div className={`glass-panel p-3.5 rounded-lg ${colors.border} w-56 select-none text-left relative overflow-hidden ${colors.bg} ${colors.glow}${d.isFocused ? ' ring-2 ring-[var(--accent-primary)]' : ''}`}>
      <div className={`absolute top-0 left-0 w-2.5 h-full ${colors.accent}`} />
      <div className="pl-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-[var(--text-secondary)] font-mono tracking-widest truncate">{String(d.type).toUpperCase()}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-green-500/10 border border-green-500/30 text-green-400 font-bold font-mono ml-2">
            {String(d.status)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] shrink-0">
            <Icon className={`w-4 h-4 ${colors.text}`} />
          </div>
          <span className="text-[var(--text-primary)] font-sans font-bold text-xs tracking-wide truncate">{String(d.label)}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Top}    className="w-2.5 h-2.5 bg-cyan-400 border border-blue-500 opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-cyan-400 border border-blue-500 opacity-0" />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW MODE — Group Node Component
// ════════════════════════════════════════════════════════════════════════════
// NOTE: onExpandGroup is stored in a module-level ref so React Flow doesn't
// need to serialize a function inside node.data (which can cause stale closures).
const _onExpandRef: { current: ((g: GroupNode) => void) | null } = { current: null }

function GroupNodeComponent({ data }: NodeProps) {
  const group = data.group as GroupNode
  const colors = CATEGORY_COLORS[group.category as GroupCategory] || CATEGORY_COLORS.backend
  const CategoryIcon = getCategoryIcon(group.category as GroupCategory)
  const nodeWidth = Math.min(200 + group.childCount * 8, 320)

  return (
    <div
      className={`glass-panel rounded-xl select-none text-left relative overflow-hidden ${colors.border} ${colors.bg} ${colors.glow}`}
      style={{ width: nodeWidth }}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${colors.accent}`} />
      <div className="pl-4 pr-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono border ${colors.badge}`}>
            <CategoryIcon className="w-2.5 h-2.5" />
            {String(group.category).toUpperCase()}
          </span>
          {group.selfEdgeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
              ↺{group.selfEdgeCount}
            </span>
          )}
        </div>

        <div>
          <p className={`font-bold text-sm font-sans ${colors.text} leading-snug`}>{String(group.label)}</p>
          <p className="text-[10px] text-[var(--text-secondary)] font-mono">{group.childCount} module{group.childCount !== 1 ? 's' : ''}</p>
        </div>

        <div className="space-y-1">
          {group.childDetails.slice(0, 3).map(child => (
            <div key={child.id} className="flex items-center gap-1.5 text-[9px] text-[var(--text-secondary)] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.accent}`} />
              <span className="truncate">{child.label}</span>
            </div>
          ))}
          {group.childCount > 3 && (
            <p className="text-[9px] text-[var(--text-tertiary)] font-mono pl-3">+{group.childCount - 3} more</p>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); _onExpandRef.current?.(group) }}
          className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono border transition-all cursor-pointer hover:opacity-80 active:scale-95 ${colors.badge}`}
        >
          See inside <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <Handle type="target" position={Position.Top}    className="w-3 h-3 opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 opacity-0" />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// INNER COMPONENT — requires ReactFlowProvider context above it
// ════════════════════════════════════════════════════════════════════════════
function ArchitectureTabInner() {
  const { analysis, setCurrentTab } = useRepoStore()

  const [viewMode,      setViewMode]      = useState<ViewMode>('overview')
  const [layoutDir,     setLayoutDir]     = useState<'TB' | 'LR'>('TB')
  const [selectedNode,  setSelectedNode]  = useState<DetailedNodeData | null>(null)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<GroupNode | null>(null)
  const [renderError,   setRenderError]   = useState<string | null>(null)

  const focusApplied = useRef(false)
  const reactFlow = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Keep the expand callback in a module-level ref so GroupNodeComponent can
  // always call the latest version without needing it in node data.
  _onExpandRef.current = setExpandedGroup

  // ── Compute summary (safe — wrapped in try/catch) ──────────────────────
  const summaryResult = useMemo(() => {
    if (!analysis?.graph) return null
    try {
      return summarizeGraph(analysis.graph)
    } catch (err) {
      console.error('[ArchitectureTab] summarizeGraph failed:', err)
      return null
    }
  }, [analysis])

  // ── Stable node type maps ───────────────────────────────────────────────
  const overviewNodeTypes = useMemo(() => ({ groupNode: GroupNodeComponent }), [])
  const detailedNodeTypes = useMemo(() => ({ hudNode:   HudNodeComponent }),   [])

  // ── Rebuild graph when key deps change ─────────────────────────────────
  useEffect(() => {
    if (!analysis?.graph) return
    setRenderError(null)

    try {
      if (viewMode === 'overview' && summaryResult) {
        // ── Overview ──────────────────────────────────────────────────────
        const rfNodes: Node[] = summaryResult.groups.map(group => ({
          id:       group.id,
          type:     'groupNode',
          position: { x: 0, y: 0 },
          data:     { group },         // no function in data — use _onExpandRef instead
        }))

        const rfEdges: Edge[] = summaryResult.edges.map(e => ({
          id:           e.id,
          source:       e.source,
          target:       e.target,
          animated:     false,
          label:        e.count > 1 ? `×${e.count}` : undefined,
          style:        { stroke: '#475569', strokeWidth: 1.5 },
          labelStyle:   { fill: '#94A3B8', fontSize: 9, fontWeight: 'bold' },
          labelBgStyle: { fill: '#0B1220', fillOpacity: 0.9 },
          labelBgPadding: [5, 3] as [number, number],
        }))

        const { nodes: ln, edges: le } = getLayoutedElements(rfNodes, rfEdges, layoutDir, 260, 140, 140, 120)
        setNodes([...ln])
        setEdges([...le])

      } else {
        // ── Detailed ──────────────────────────────────────────────────────
        const nodeTypeMap: Record<string, string> = {}
        analysis.graph.nodes.forEach(n => { nodeTypeMap[n.id] = n.type.toLowerCase() })

        const rfNodes: Node[] = analysis.graph.nodes.map(n => {
          const nt     = n.type.toLowerCase()
          const colors = ROLE_COLORS[nt] || ROLE_COLORS['default']
          return {
            id:       n.id,
            type:     'hudNode',
            position: { x: 0, y: 0 },
            data: {
              label:  n.label,
              type:   n.type,
              status: 'SCANNED',
              icon:   getNodeIcon(nt),
              details:`Located at ${n.file}${n.line ? ` (Line ${n.line})` : ''}`,
              specifications: {
                'File Path':           n.file,
                'Type':                n.type,
                'Architectural Layer': ['Entry Point','Routes/Controllers','Middleware','Services/Logic','Models/Data','Config','Utilities','Tests'][getLayer(nt)] || 'Unknown',
              },
              githubUrl:  n.githubUrl,
              roleColors: colors,
              layer:      getLayer(nt),
              isFocused:  n.id === focusedNodeId,
            } as DetailedNodeData,
          }
        })

        const rfEdges: Edge[] = analysis.graph.edges.map(e => {
          const label = inferEdgeLabel(nodeTypeMap[e.source] || 'unknown', nodeTypeMap[e.target] || 'unknown', e.label)
          return {
            id: e.id, source: e.source, target: e.target,
            animated: true,
            style: { stroke: getEdgeColor(label), strokeWidth: 1.5 },
            label,
            labelStyle:   { fill: '#94A3B8', fontSize: 9, fontWeight: 'bold' },
            labelBgStyle: { fill: '#0B1220', fillOpacity: 0.9 },
            labelBgPadding: [6, 4] as [number, number],
          }
        })

        const { nodes: ln, edges: le } = getLayoutedElements(rfNodes, rfEdges, layoutDir)
        setNodes([...ln])
        setEdges([...le])
        focusApplied.current = false
      }
    } catch (err: any) {
      console.error('[ArchitectureTab] graph build failed:', err)
      setRenderError(String(err?.message || err))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, layoutDir, summaryResult, analysis])  // focusedNodeId is intentionally excluded — we patch node data below

  // ── Patch isFocused flag on existing nodes (avoids full rebuild) ────────
  useEffect(() => {
    if (!focusedNodeId) return
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isFocused: n.id === focusedNodeId },
    })))
  }, [focusedNodeId, setNodes])

  // ── Focus / centre the node in the ReactFlow canvas ────────────────────
  useEffect(() => {
    if (viewMode !== 'detailed' || !focusedNodeId || focusApplied.current) return
    const timer = setTimeout(() => {
      try {
        const node = reactFlow.getNode(focusedNodeId)
        if (node) {
          reactFlow.setCenter(node.position.x + 120, node.position.y + 40, { zoom: 1.6, duration: 600 })
          focusApplied.current = true
        }
      } catch { /* ignore if flow not ready */ }
    }, 400)
    return () => clearTimeout(timer)
  }, [viewMode, focusedNodeId, nodes, reactFlow])

  // ── Click handlers ──────────────────────────────────────────────────────
  const onNodeClick = useCallback((_: any, node: any) => {
    if (viewMode === 'detailed') {
      setSelectedNode(node.data as DetailedNodeData)
      setFocusedNodeId(node.id)
    }
  }, [viewMode])

  // ── Navigate child → Detailed focused ──────────────────────────────────
  const handleFocusChild = useCallback((childId: string) => {
    setFocusedNodeId(childId)
    setExpandedGroup(null)
    setViewMode('detailed')
    setCurrentTab('Architecture')
  }, [setCurrentTab])

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER GUARDS
  // ─────────────────────────────────────────────────────────────────────────
  if (!analysis?.graph) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="glass-panel p-8 rounded-xl text-center space-y-3 border border-[var(--border-color)]">
          <Workflow className="w-10 h-10 text-[var(--text-tertiary)] mx-auto" />
          <p className="text-[var(--text-secondary)] font-mono text-sm">No graph data available.</p>
          <p className="text-[var(--text-tertiary)] font-mono text-xs">Analyze a repository first.</p>
        </div>
      </div>
    )
  }

  if (renderError) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="glass-panel p-8 rounded-xl text-center space-y-3 border border-red-500/30">
          <p className="text-red-400 font-mono text-sm">Graph render error</p>
          <p className="text-[var(--text-tertiary)] font-mono text-xs max-w-sm">{renderError}</p>
          <button
            onClick={() => { setRenderError(null); setViewMode('detailed') }}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-mono text-xs cursor-pointer"
          >
            Try Detailed View
          </button>
        </div>
      </div>
    )
  }

  // Small-repo heuristic: if summarizer found < 4 groups, force Detailed
  const isTinyRepo      = !summaryResult || summaryResult.tooSmall
  const effectiveMode   = isTinyRepo ? 'detailed' : viewMode
  const nodeTypes       = effectiveMode === 'overview' ? overviewNodeTypes : detailedNodeTypes

  // ── Legend data ─────────────────────────────────────────────────────────
  const overviewLegend = [
    { label: 'Frontend',  color: 'bg-blue-500'    },
    { label: 'Backend',   color: 'bg-violet-500'  },
    { label: 'Services',  color: 'bg-emerald-500' },
    { label: 'Data',      color: 'bg-teal-500'    },
    { label: 'External',  color: 'bg-amber-500'   },
  ]
  const detailedLegend = [
    { label: 'Entry Point', color: 'bg-blue-400'   },
    { label: 'Routes',      color: 'bg-cyan-400'   },
    { label: 'Middleware',  color: 'bg-orange-400' },
    { label: 'Services',    color: 'bg-green-400'  },
    { label: 'Models',      color: 'bg-purple-400' },
    { label: 'Config',      color: 'bg-yellow-400' },
    { label: 'Utils',       color: 'bg-slate-400'  },
  ]
  const legend = effectiveMode === 'overview' ? overviewLegend : detailedLegend

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-120px)] flex gap-4 font-mono text-[var(--text-primary)] relative select-none"
    >
      {/* ── Main canvas ───────────────────────────────────────────────────── */}
      <div className="flex-1 glass-panel rounded-xl overflow-hidden relative border-[var(--border-color)]">

        {/* Top-left: title + layout toggles */}
        <div className="absolute top-4 left-4 z-10 space-y-3 pointer-events-none">
          <div className="bg-[var(--surface-card)]/90 border border-[var(--border-color)] p-3 rounded-lg shadow-sm">
            <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
              <Workflow className="w-3.5 h-3.5" />
              <span>INTERACTIVE ARCHITECTURE SCHEMATIC</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-sans max-w-sm mt-1">
              {effectiveMode === 'overview'
                ? 'High-level module groups. Click "See inside" to explore. Toggle for full graph.'
                : 'Full node graph. Color-coded by layer. Click nodes to inspect.'}
            </p>
          </div>

          <div className="pointer-events-auto flex items-center space-x-2">
            {(['TB', 'LR'] as const).map(dir => (
              <button key={dir} onClick={() => setLayoutDir(dir)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  layoutDir === dir
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400'
                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {dir === 'TB' ? '↕ Vertical' : '↔ Horizontal'}
              </button>
            ))}
          </div>
        </div>

        {/* Top-right: Overview / Detailed pill toggle */}
        {!isTinyRepo && (
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full p-1 gap-1 shadow-lg">
              {([
                { mode: 'overview' as ViewMode, icon: LayoutDashboard, label: 'Overview' },
                { mode: 'detailed' as ViewMode, icon: List,            label: 'Detailed' },
              ] as const).map(({ mode, icon: Icon, label }) => (
                <button key={mode}
                  onClick={() => {
                    setViewMode(mode)
                    setSelectedNode(null)
                    setExpandedGroup(null)
                    if (mode === 'overview') setFocusedNodeId(null)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer ${
                    viewMode === mode
                      ? 'bg-[var(--accent-primary)] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3 h-3" />{label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tiny-repo banner */}
        {isTinyRepo && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[10px] text-[var(--text-secondary)] font-mono">
            <Info className="w-3 h-3 text-amber-400 shrink-0" />
            Small repo — showing full detail view.
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-[var(--surface-card)] border border-[var(--border-color)] p-3 rounded-lg shadow-sm">
          <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest block mb-2">
            {effectiveMode === 'overview' ? 'CATEGORY LEGEND' : 'LAYER LEGEND'}
          </span>
          <div className="flex flex-wrap gap-2">
            {legend.map(item => (
              <div key={item.label} className="flex items-center space-x-1.5">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[9px] text-[var(--text-secondary)] font-sans">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* React Flow canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.08}
          maxZoom={2}
        >
          <Background color="#1E293B" gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node: any) => {
              if (effectiveMode === 'overview') {
                const g = node.data?.group as GroupNode | undefined
                return g ? (CATEGORY_COLORS[g.category]?.minimap ?? '#334155') : '#334155'
              }
              const c = node.data?.roleColors?.accent ?? ''
              if (c.includes('cyan'))   return '#22d3ee'
              if (c.includes('orange')) return '#f97316'
              if (c.includes('purple')) return '#a855f7'
              if (c.includes('green'))  return '#4ade80'
              if (c.includes('yellow')) return '#eab308'
              if (c.includes('blue'))   return '#3b82f6'
              if (c.includes('indigo')) return '#6366f1'
              return '#64748b'
            }}
            style={{ backgroundColor: '#0B1220', borderRadius: '8px', border: '1px solid #1e293b' }}
            maskColor="rgba(5,7,10,0.7)"
          />
        </ReactFlow>
      </div>

      {/* ── Detailed node info panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNode && effectiveMode === 'detailed' && (
          <motion.div
            key="detail-panel"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-full glass-panel rounded-xl p-5 border-l border-[var(--border-color)] bg-[var(--surface-card)] flex flex-col justify-between absolute right-0 z-30 lg:relative lg:right-auto text-left shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center space-x-2">
                  {(() => { const Icon = selectedNode.icon; return <Icon className={`w-5 h-5 ${selectedNode.roleColors?.text || 'text-cyan-400'} shrink-0`} /> })()}
                  <span className="font-bold text-[var(--text-primary)] tracking-tight text-sm font-sans truncate">{String(selectedNode.label)}</span>
                </div>
                <button onClick={() => setSelectedNode(null)}
                  className="p-1 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0 ml-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 font-sans">
                <span className="text-[9px] text-[var(--text-secondary)] font-mono tracking-widest uppercase">MODULE DESCRIPTION</span>
                <p className="text-[var(--text-primary)] text-xs leading-relaxed">{String(selectedNode.details)}</p>
                {selectedNode.githubUrl && (
                  <a href={String(selectedNode.githubUrl)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 mt-2 px-3 py-1.5 border border-[var(--border-color)] hover:border-cyan-400 hover:text-cyan-400 bg-[var(--bg-secondary)] rounded-lg text-[10px] font-bold transition-colors">
                    <span>View in GitHub</span><ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="space-y-3 font-mono">
                <span className="text-[9px] text-[var(--text-secondary)] tracking-widest uppercase">SPECIFICATION MATRIX</span>
                <div className="bg-[var(--bg-primary)] border border-slate-850 p-3 rounded-lg space-y-2 text-[11px] break-all">
                  {Object.entries(selectedNode.specifications).map(([k, v]) => (
                    <div key={k} className="flex flex-col border-b border-slate-900 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="text-[var(--text-secondary)] mb-0.5">{k}:</span>
                      <span className="text-cyan-400 font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
              <span>SYS_DEPS: SYNCED</span>
              <span className="text-green-400 font-bold">ACTIVE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overview group expansion panel ──────────────────────────────── */}
      <AnimatePresence>
        {expandedGroup && effectiveMode === 'overview' && (
          <motion.div
            key="group-panel"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-full glass-panel rounded-xl border-l border-[var(--border-color)] bg-[var(--surface-card)] flex flex-col absolute right-0 z-30 lg:relative lg:right-auto shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] shrink-0">
              {(() => {
                const colors   = CATEGORY_COLORS[expandedGroup.category] || CATEGORY_COLORS.backend
                const Icon     = getCategoryIcon(expandedGroup.category)
                return (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg border ${colors.badge} shrink-0`}><Icon className={`w-3.5 h-3.5 ${colors.text}`} /></div>
                    <div className="min-w-0">
                      <p className="text-[var(--text-primary)] font-bold text-sm font-sans truncate">{expandedGroup.label}</p>
                      <p className="text-[var(--text-tertiary)] font-mono text-[10px]">{expandedGroup.childCount} modules</p>
                    </div>
                  </div>
                )
              })()}
              <button onClick={() => setExpandedGroup(null)}
                className="p-1 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0 ml-3">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hint */}
            <p className="px-5 py-2 text-[10px] text-[var(--text-secondary)] font-mono border-b border-[var(--border-color)] shrink-0">
              Click <span className="text-[var(--accent-primary)] font-bold">→ Focus</span> to open Detailed view centred on that module.
            </p>

            {/* Child list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {expandedGroup.childDetails.map(child => {
                const colors = ROLE_COLORS[child.role.toLowerCase()] || ROLE_COLORS['default']
                const Icon   = getNodeIcon(child.role.toLowerCase())
                return (
                  <div key={child.id} className={`glass-panel rounded-lg p-3 border ${colors.border} ${colors.bg} space-y-2`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] shrink-0">
                          <Icon className={`w-3 h-3 ${colors.text}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-xs font-sans truncate ${colors.text}`}>{child.label}</p>
                          <p className="text-[9px] text-[var(--text-tertiary)] font-mono truncate">{child.file}</p>
                        </div>
                      </div>
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                        {child.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleFocusChild(child.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono border transition-all cursor-pointer bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 active:scale-95">
                        → Focus in Detailed
                      </button>
                      {child.githubUrl && (
                        <a href={child.githubUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="View on GitHub">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border-color)] px-5 py-3 flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-mono shrink-0">
              <span>GROUP: {String(expandedGroup.category).toUpperCase()}</span>
              {expandedGroup.selfEdgeCount > 0 && <span className="text-amber-400">↺ {expandedGroup.selfEdgeCount} internal edges</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTED wrapper — ReactFlowProvider is required for useReactFlow()
// ════════════════════════════════════════════════════════════════════════════
export default function ArchitectureTab() {
  return (
    <ReactFlowProvider>
      <ArchitectureTabInner />
    </ReactFlowProvider>
  )
}
