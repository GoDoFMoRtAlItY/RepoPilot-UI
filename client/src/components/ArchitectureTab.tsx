import { useState, useCallback, useMemo, useEffect } from 'react'
import { 
  ReactFlow, 
  Background, 
  Controls, 
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
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dagre from '@dagrejs/dagre'
import { useRepoStore } from '../store/useRepoStore'

// Custom node data structure
interface CustomNodeData extends Record<string, unknown> {
  label: string
  status: string
  icon: React.ComponentType<{ className?: string }>
  type: string
  details: string
  specifications: Record<string, string>
  githubUrl?: string
}

type CustomNodeType = Node<CustomNodeData, 'hudNode'>

// Custom Node Component to fit the HUD aesthetic
function HudNodeComponent({ data }: NodeProps<CustomNodeType>) {
  const Icon = data.icon

  return (
    <div className="glass-panel p-3.5 rounded-lg border-blue-500/30 w-52 select-none text-left relative overflow-hidden bg-[#0B1220]/90">
      <div className="absolute top-0 left-0 w-2.5 h-full bg-cyan-400" />
      <div className="pl-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-slate-500 font-mono tracking-widest truncate">{data.type.toUpperCase()}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-green-500/10 border border-green-500/30 text-green-400 font-bold font-mono ml-2">
            {data.status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-slate-950 border border-slate-800 shrink-0">
            <Icon className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-white font-sans font-bold text-xs tracking-wide truncate">{data.label}</span>
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
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 100 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 80 })
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
      x: nodeWithPosition.x - 220 / 2,
      y: nodeWithPosition.y - 80 / 2,
    }

    return node
  })

  return { nodes, edges }
}

export default function ArchitectureTab() {
  const { analysis } = useRepoStore()
  const [selectedNode, setSelectedNode] = useState<CustomNodeData | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (analysis && analysis.graph) {
      const rfNodes: Node[] = analysis.graph.nodes.map(n => {
        let icon = FileCode
        if (n.type === 'directory') icon = Box
        if (n.type === 'system') icon = BoxSelect

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
              'Type': n.type
            },
            githubUrl: n.githubUrl
          }
        }
      })

      const rfEdges: Edge[] = analysis.graph.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 1.5 },
        label: e.label,
        labelStyle: { fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
        labelBgStyle: { fill: '#0B1220', fillOpacity: 0.8 }
      }))

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        rfNodes,
        rfEdges,
        'TB'
      )

      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    }
  }, [analysis, setNodes, setEdges])

  // Memoize custom nodeType dictionary
  const nodeTypes = useMemo(() => ({
    hudNode: HudNodeComponent
  }), [])

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.data as CustomNodeData)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-120px)] flex gap-4 font-mono text-slate-300 relative select-none"
    >
      {/* Main flowchart canvas */}
      <div className="flex-1 glass-panel rounded-xl overflow-hidden relative border-slate-800/80">
        <div className="absolute top-4 left-4 z-10 space-y-1 bg-[#0B1220]/80 border border-slate-800 p-3 rounded-lg pointer-events-none">
          <div className="text-xs text-cyan-400 font-semibold uppercase flex items-center space-x-1.5 font-mono">
            <Workflow className="w-3.5 h-3.5" />
            <span>INTERACTIVE COMPONENT SCHEMATIC</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans max-w-sm">
            Zoom/Pan to inspect node parameters. Select any module node block to project details in the HUD panel.
          </p>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#1E293B" gap={20} size={1} />
          <Controls showInteractive={false} />
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
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <selectedNode.icon className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white tracking-tight text-sm font-sans truncate">{selectedNode.label}</span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5 font-sans">
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">MODULE DESCRIPTION</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {selectedNode.details}
                </p>
                {selectedNode.githubUrl && (
                  <a 
                    href={selectedNode.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 mt-2 px-3 py-1.5 border border-slate-700 hover:border-cyan-400 hover:text-cyan-400 bg-slate-900 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    <span>View in GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Detailed Specs list */}
              <div className="space-y-3 font-mono">
                <span className="text-[9px] text-slate-500 tracking-widest uppercase">SPECIFICATION MATRIX</span>
                <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-lg space-y-2 text-[11px] overflow-hidden break-all">
                  {Object.entries(selectedNode.specifications).map(([key, val]) => (
                    <div key={key} className="flex flex-col border-b border-slate-900 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="text-slate-500 mb-0.5">{key}:</span>
                      <span className="text-cyan-400 font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom System Sync Label */}
            <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-[10px] text-slate-500">
              <span>SYS_DEPS: SYNCED</span>
              <span className="text-green-400 font-bold">ACTIVE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
