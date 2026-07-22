/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo, useEffect } from 'react'
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
  type NodeProps
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
  Globe
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dagre from '@dagrejs/dagre'
import { useRepoStore } from '../store/useRepoStore'

// Role-based color palette for nodes
const ROLE_COLORS: Record<string, { bg: string, border: string, accent: string, text: string, glow: string }> = {
  'route':      { bg: 'bg-[#0a1628]', border: 'border-cyan-500/40',   accent: 'bg-cyan-400',   text: 'text-cyan-600 dark:text-cyan-400',   glow: 'shadow-[0_0_8px_rgba(34,211,238,0.15)]' },
  'controller': { bg: 'bg-[#0a1628]', border: 'border-cyan-500/40',   accent: 'bg-cyan-400',   text: 'text-cyan-600 dark:text-cyan-400',   glow: 'shadow-[0_0_8px_rgba(34,211,238,0.15)]' },
  'middleware':  { bg: 'bg-[#1a0f28]', border: 'border-orange-500/40', accent: 'bg-orange-400', text: 'text-orange-400', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.15)]' },
  'model':      { bg: 'bg-[#0f1628]', border: 'border-purple-500/40', accent: 'bg-purple-400', text: 'text-purple-600 dark:text-purple-400', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.15)]' },
  'service':    { bg: 'bg-[#0f1a1a]', border: 'border-green-500/40',  accent: 'bg-green-400',  text: 'text-green-400',  glow: 'shadow-[0_0_8px_rgba(74,222,128,0.15)]' },
  'config':     { bg: 'bg-[#1a1a0f]', border: 'border-yellow-500/40', accent: 'bg-yellow-400', text: 'text-yellow-400', glow: 'shadow-[0_0_8px_rgba(250,204,21,0.15)]' },
  'util':       { bg: 'bg-[#0B1220]', border: 'border-slate-500/40',  accent: 'bg-slate-400',  text: 'text-[var(--text-secondary)]',  glow: '' },
  'test':       { bg: 'bg-[#0B1220]', border: 'border-indigo-500/40', accent: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', glow: '' },
  'entry':      { bg: 'bg-[#0f1a28]', border: 'border-blue-500/50',   accent: 'bg-blue-400',   text: 'text-blue-600 dark:text-blue-400',   glow: 'shadow-[0_0_12px_rgba(59,130,246,0.25)]' },
  'directory':  { bg: 'bg-[#0B1220]', border: 'border-slate-600/40',  accent: 'bg-slate-500',  text: 'text-[var(--text-secondary)]',  glow: '' },
  'system':     { bg: 'bg-[#0a1628]', border: 'border-blue-500/40',   accent: 'bg-blue-400',   text: 'text-blue-600 dark:text-blue-400',   glow: 'shadow-[0_0_8px_rgba(59,130,246,0.15)]' },
  'default':    { bg: 'bg-[#0B1220]', border: 'border-[var(--border-color)]',  accent: 'bg-cyan-400',   text: 'text-[var(--text-primary)]',  glow: '' },
}

// Get the appropriate icon for each node type
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

// Determine the architectural layer for ranking
function getLayer(type: string): number {
  switch (type) {
    case 'entry': return 0
    case 'route': case 'controller': return 1
    case 'middleware': return 2
    case 'service': return 3
    case 'model': return 4
    case 'config': return 5
    case 'util': return 6
    case 'test': return 7
    default: return 3
  }
}

// Custom node data structure
interface CustomNodeData extends Record<string, unknown> {
  label: string
  status: string
  icon: React.ComponentType<{ className?: string }>
  type: string
  details: string
  specifications: Record<string, string>
  githubUrl?: string
  roleColors: typeof ROLE_COLORS['default']
  layer: number
}

type CustomNodeType = Node<CustomNodeData, 'hudNode'>

// Custom Node Component — color-coded by role
function HudNodeComponent({ data }: NodeProps<CustomNodeType>) {
  const Icon = data.icon
  const colors = data.roleColors

  return (
    <div className={`glass-panel p-3.5 rounded-lg ${colors.border} w-56 select-none text-left relative overflow-hidden ${colors.bg} ${colors.glow}`}>
      <div className={`absolute top-0 left-0 w-2.5 h-full ${colors.accent}`} />
      <div className="pl-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-[var(--text-secondary)] font-mono tracking-widest truncate">{data.type.toUpperCase()}</span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-green-500/10 border border-green-500/30 text-green-400 font-bold font-mono ml-2`}>
            {data.status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] shrink-0">
            <Icon className={`w-4 h-4 ${colors.text}`} />
          </div>
          <span className="text-[var(--text-primary)] font-sans font-bold text-xs tracking-wide truncate">{data.label}</span>
        </div>
      </div>
      
      {/* React Flow Handles */}
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-cyan-400 border border-blue-500 opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-cyan-400 border border-blue-500 opacity-0" />
    </div>
  )
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80, edgesep: 30 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 240, height: 80 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = isHorizontal ? Position.Left : Position.Top
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom

    node.position = {
      x: nodeWithPosition.x - 240 / 2,
      y: nodeWithPosition.y - 80 / 2,
    }

    return node
  })

  return { nodes, edges }
}

// Infer edge label based on source and target types
function inferEdgeLabel(sourceType: string, targetType: string, explicitLabel?: string): string {
  if (explicitLabel && explicitLabel !== 'depends') return explicitLabel
  
  const pair = `${sourceType}->${targetType}`
  switch (pair) {
    case 'entry->route': case 'entry->controller': return 'registers'
    case 'route->middleware': case 'controller->middleware': return 'uses middleware'
    case 'route->service': case 'controller->service': return 'calls'
    case 'route->model': case 'controller->model': return 'queries'
    case 'service->model': return 'reads/writes'
    case 'middleware->service': return 'validates via'
    case 'model->config': return 'configured by'
    case 'service->config': return 'configured by'
    case 'route->util': case 'service->util': return 'uses'
    default: return explicitLabel || 'imports'
  }
}

// Edge color based on relationship
function getEdgeColor(label: string): string {
  if (label.includes('middleware') || label.includes('validates')) return '#f97316'
  if (label.includes('queries') || label.includes('reads') || label.includes('writes')) return '#a855f7'
  if (label.includes('calls')) return '#22d3ee'
  if (label.includes('registers')) return '#3b82f6'
  if (label.includes('configured')) return '#eab308'
  return '#3B82F6'
}

export default function ArchitectureTab() {
  const { analysis } = useRepoStore()
  const [selectedNode, setSelectedNode] = useState<CustomNodeData | null>(null)
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB')

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (analysis && analysis.graph) {
      const rfNodes: Node[] = analysis.graph.nodes.map(n => {
        const nodeType = n.type.toLowerCase()
        const colors = ROLE_COLORS[nodeType] || ROLE_COLORS['default']
        const icon = getNodeIcon(nodeType)
        const layer = getLayer(nodeType)

        return {
          id: n.id,
          type: 'hudNode',
          position: { x: 0, y: 0 },
          data: {
            label: n.label,
            type: n.type,
            status: 'SCANNED',
            icon,
            details: `Located at ${n.file}${n.line ? ` (Line ${n.line})` : ''}`,
            specifications: {
              'File Path': n.file,
              'Type': n.type,
              'Architectural Layer': ['Entry Point', 'Routes/Controllers', 'Middleware', 'Services/Logic', 'Models/Data', 'Config', 'Utilities', 'Tests'][layer] || 'Unknown'
            },
            githubUrl: n.githubUrl,
            roleColors: colors,
            layer
          }
        }
      })

      // Build a type lookup for edge labeling
      const nodeTypeMap: Record<string, string> = {}
      analysis.graph.nodes.forEach(n => { nodeTypeMap[n.id] = n.type.toLowerCase() })

      const rfEdges: Edge[] = analysis.graph.edges.map(e => {
        const sourceType = nodeTypeMap[e.source] || 'unknown'
        const targetType = nodeTypeMap[e.target] || 'unknown'
        const label = inferEdgeLabel(sourceType, targetType, e.label)
        const color = getEdgeColor(label)

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: color, strokeWidth: 1.5 },
          label,
          labelStyle: { fill: '#94A3B8', fontSize: 9, fontWeight: 'bold' },
          labelBgStyle: { fill: '#0B1220', fillOpacity: 0.9 },
          labelBgPadding: [6, 4] as [number, number]
        }
      })

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        rfNodes,
        rfEdges,
        layoutDirection
      )

      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    }
  }, [analysis, layoutDirection, setNodes, setEdges])

  // Memoize custom nodeType dictionary
  const nodeTypes = useMemo(() => ({
    hudNode: HudNodeComponent
  }), [])

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.data as CustomNodeData)
  }, [])

  // Legend items
  const legendItems = [
    { label: 'Entry Point', color: 'bg-blue-400' },
    { label: 'Routes', color: 'bg-cyan-400' },
    { label: 'Middleware', color: 'bg-orange-400' },
    { label: 'Services', color: 'bg-green-400' },
    { label: 'Models', color: 'bg-purple-400' },
    { label: 'Config', color: 'bg-yellow-400' },
    { label: 'Utils', color: 'bg-slate-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-120px)] flex gap-4 font-mono text-[var(--text-primary)] relative select-none"
    >
      {/* Main flowchart canvas */}
      <div className="flex-1 glass-panel rounded-xl overflow-hidden relative border-[var(--border-color)]">
        {/* Top overlay: title + layout toggle */}
        <div className="absolute top-4 left-4 z-10 space-y-3">
          <div className="bg-[#0B1220]/90 border border-[var(--border-color)] p-3 rounded-lg pointer-events-none">
            <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold uppercase flex items-center space-x-1.5 font-mono">
              <Workflow className="w-3.5 h-3.5" />
              <span>INTERACTIVE ARCHITECTURE SCHEMATIC</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-sans max-w-sm mt-1">
              Color-coded by architectural layer. Click nodes to inspect. Zoom/pan to navigate.
            </p>
          </div>
          
          {/* Layout toggle */}
          <div className="pointer-events-auto flex items-center space-x-2">
            <button
              onClick={() => setLayoutDirection('TB')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                layoutDirection === 'TB' 
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400' 
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              ↕ Vertical
            </button>
            <button
              onClick={() => setLayoutDirection('LR')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                layoutDirection === 'LR' 
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400' 
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              ↔ Horizontal
            </button>
          </div>
        </div>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-[#0B1220]/90 border border-[var(--border-color)] p-3 rounded-lg">
          <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest block mb-2">LAYER LEGEND</span>
          <div className="flex flex-wrap gap-2">
            {legendItems.map(item => (
              <div key={item.label} className="flex items-center space-x-1.5">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[9px] text-[var(--text-secondary)] font-sans">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#1E293B" gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node: any) => {
              const colors = node.data?.roleColors
              if (!colors) return '#334155'
              // Extract color from the accent class
              if (colors.accent.includes('cyan')) return '#22d3ee'
              if (colors.accent.includes('orange')) return '#f97316'
              if (colors.accent.includes('purple')) return '#a855f7'
              if (colors.accent.includes('green')) return '#4ade80'
              if (colors.accent.includes('yellow')) return '#eab308'
              if (colors.accent.includes('blue')) return '#3b82f6'
              if (colors.accent.includes('indigo')) return '#6366f1'
              return '#64748b'
            }}
            style={{ 
              backgroundColor: '#0B1220',
              borderRadius: '8px',
              border: '1px solid #1e293b'
            }}
            maskColor="rgba(5, 7, 10, 0.7)"
          />
        </ReactFlow>
      </div>

      {/* Side HUD panel for Selected Node details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-full glass-panel rounded-xl p-5 border-l border-cyan-500/20 bg-[#0B1220]/95 flex flex-col justify-between absolute right-0 z-30 lg:relative lg:right-auto text-left shadow-2xl"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center space-x-2">
                  <selectedNode.icon className={`w-5 h-5 ${(selectedNode.roleColors as any)?.text || 'text-cyan-600 dark:text-cyan-400'} shrink-0`} />
                  <span className="font-bold text-[var(--text-primary)] tracking-tight text-sm font-sans truncate">{selectedNode.label}</span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5 font-sans">
                <span className="text-[9px] text-[var(--text-secondary)] font-mono tracking-widest uppercase">MODULE DESCRIPTION</span>
                <p className="text-[var(--text-primary)] text-xs leading-relaxed">
                  {selectedNode.details}
                </p>
                {selectedNode.githubUrl && (
                  <a 
                    href={selectedNode.githubUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 mt-2 px-3 py-1.5 border border-[var(--border-color)] hover:border-cyan-400 hover:text-cyan-600 dark:text-cyan-400 bg-[var(--bg-secondary)] rounded-lg text-[10px] font-bold transition-colors"
                  >
                    <span>View in GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Detailed Specs list */}
              <div className="space-y-3 font-mono">
                <span className="text-[9px] text-[var(--text-secondary)] tracking-widest uppercase">SPECIFICATION MATRIX</span>
                <div className="bg-[var(--bg-primary)] border border-slate-850 p-3 rounded-lg space-y-2 text-[11px] overflow-hidden break-all">
                  {Object.entries(selectedNode.specifications).map(([key, val]) => (
                    <div key={key} className="flex flex-col border-b border-slate-900 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="text-[var(--text-secondary)] mb-0.5">{key}:</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{val as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom System Sync Label */}
            <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
              <span>SYS_DEPS: SYNCED</span>
              <span className="text-green-400 font-bold">ACTIVE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
