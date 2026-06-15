import { useState, useCallback, useMemo } from 'react'
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
  Database, 
  Globe, 
  KeyRound, 
  ShieldCheck, 
  X,
  Server,
  Workflow
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Custom node data structure
interface CustomNodeData extends Record<string, unknown> {
  label: string
  status: string
  icon: React.ComponentType<{ className?: string }>
  type: string
  details: string
  specifications: Record<string, string>
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
          <span className="text-[8px] text-slate-500 font-mono tracking-widest">{data.type.toUpperCase()}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-green-500/10 border border-green-500/30 text-green-400 font-bold font-mono">
            {data.status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
            <Icon className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-white font-sans font-bold text-xs tracking-wide">{data.label}</span>
        </div>
      </div>
      
      {/* React Flow Handles */}
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-cyan-400 border border-blue-500" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-cyan-400 border border-blue-500" />
    </div>
  )
}

export default function ArchitectureTab() {
  const [selectedNode, setSelectedNode] = useState<CustomNodeData | null>(null)

  // Map icons
  const initialNodes: CustomNodeType[] = [
    {
      id: 'node-fe',
      type: 'hudNode',
      position: { x: 50, y: 150 },
      data: {
        label: 'Vite React Client',
        type: 'Frontend',
        status: 'ONLINE',
        icon: Globe,
        details: 'The user-facing workspace hub compiled using Vite, React 19, and Tailwind CSS v4. Managed via client side router contexts.',
        specifications: {
          'Framework': 'React 19.2.6',
          'Vite Bundler': 'v8.0.12',
          'Styling Core': 'Tailwind CSS v4',
          'State Store': 'Zustand Store Context'
        }
      }
    },
    {
      id: 'node-auth',
      type: 'hudNode',
      position: { x: 300, y: 30 },
      data: {
        label: 'GitHub OAuth Gateway',
        type: 'Security',
        status: 'ONLINE',
        icon: KeyRound,
        details: 'Handles token authorization handshakes and GitHub profile synchronization routing checks.',
        specifications: {
          'Protocol': 'OAuth 2.0 Client Flow',
          'Endpoint': '/api/v1/auth/github',
          'Access Scope': 'repo, read:user, user:email',
          'Encryption': 'JWT State Tokens'
        }
      }
    },
    {
      id: 'node-api',
      type: 'hudNode',
      position: { x: 300, y: 150 },
      data: {
        label: 'APIs Ingestion Gateway',
        type: 'Server Router',
        status: 'ONLINE',
        icon: Server,
        details: 'The central express server router executing parser scripts on the workspace codebase and mapping active route patterns.',
        specifications: {
          'Engine Runtime': 'Node.js v24.15',
          'Route Ingest': 'Express router v4',
          'Context Load': 'AST Syntax Parsing Trees',
          'Rate Limit': '100 requests / min'
        }
      }
    },
    {
      id: 'node-db',
      type: 'hudNode',
      position: { x: 580, y: 80 },
      data: {
        label: 'PostgreSQL DB Cluster',
        type: 'Database',
        status: 'ONLINE',
        icon: Database,
        details: 'Main PostgreSQL database storing code metadata indexes, workspace configurations, and generated file structures.',
        specifications: {
          'Version': 'PostgreSQL v16',
          'Local Port': '5432',
          'Schema Engine': 'Prisma Schema Mapping',
          'Tables Count': '12 relational maps'
        }
      }
    },
    {
      id: 'node-cache',
      type: 'hudNode',
      position: { x: 580, y: 220 },
      data: {
        label: 'Redis Cache Node',
        type: 'Cache',
        status: 'ONLINE',
        icon: ShieldCheck,
        details: 'High-speed in-memory store caching AST analysis results to prevent redundant processing steps.',
        specifications: {
          'Key Store': 'Redis v7 Server',
          'Local Port': '6379',
          'TTL Duration': '86400 seconds (24h)',
          'Sync Speed': '< 2ms reading rate'
        }
      }
    }
  ]

  const initialEdges: Edge[] = [
    { 
      id: 'edge-fe-api', 
      source: 'node-fe', 
      target: 'node-api', 
      animated: true,
      style: { stroke: '#3B82F6', strokeWidth: 2 }
    },
    { 
      id: 'edge-fe-auth', 
      source: 'node-fe', 
      target: 'node-auth', 
      animated: true,
      style: { stroke: '#8B5CF6', strokeWidth: 2 }
    },
    { 
      id: 'edge-auth-api', 
      source: 'node-auth', 
      target: 'node-api', 
      style: { stroke: '#CBD5E1', strokeWidth: 1.5 }
    },
    { 
      id: 'edge-api-db', 
      source: 'node-api', 
      target: 'node-db', 
      animated: true,
      style: { stroke: '#22D3EE', strokeWidth: 2 }
    },
    { 
      id: 'edge-api-cache', 
      source: 'node-api', 
      target: 'node-cache', 
      style: { stroke: '#3B82F6', strokeWidth: 1.5 }
    }
  ]

  const [nodes, , onNodesChange] = useNodesState<Node>(initialNodes as any[] as Node[])
  const [edges, , onEdgesChange] = useEdgesState<Edge>(initialEdges)

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
          minZoom={0.5}
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
                  <selectedNode.icon className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-white tracking-tight text-sm font-sans">{selectedNode.label}</span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white cursor-pointer"
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
              </div>

              {/* Detailed Specs list */}
              <div className="space-y-3 font-mono">
                <span className="text-[9px] text-slate-500 tracking-widest uppercase">SPECIFICATION MATRIX</span>
                <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-lg space-y-2 text-[11px]">
                  {Object.entries(selectedNode.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-900 pb-1.5 last:border-b-0 last:pb-0">
                      <span className="text-slate-500">{key}:</span>
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
