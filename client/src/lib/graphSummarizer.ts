/**
 * graphSummarizer.ts
 *
 * Pure-frontend transformation of the full graph returned by the backend
 * into a concise 6–12 node "Overview" graph suitable for high-level viewing.
 *
 * Input:  { nodes, edges } — the raw graph from analysis.graph
 * Output: { groups, edges } — a summarized graph
 *
 * No backend changes required. All grouping is deterministic and client-side.
 */

// ---------------------------------------------------------------------------
// Input types — must match backend schema in useRepoStore.ts
// ---------------------------------------------------------------------------
export interface RawNode {
  id: string;
  type: string;   // entry | route | controller | middleware | model | service | config | util | test | directory | system
  label: string;
  file: string;
  line: number;
  githubUrl: string;
}

export interface RawEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface RawGraph {
  nodes: RawNode[];
  edges: RawEdge[];
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------
export type GroupCategory = 'frontend' | 'backend' | 'services' | 'data' | 'external';

export interface ChildDetail {
  id: string;
  label: string;
  role: string;
  file: string;
  githubUrl?: string;
}

export interface GroupNode {
  id: string;
  label: string;
  category: GroupCategory;
  childCount: number;
  children: string[];        // original node IDs
  childDetails: ChildDetail[];
  selfEdgeCount: number;     // intra-group edge count
  isEntry?: boolean;
}

export interface SummaryEdge {
  id: string;
  source: string;
  target: string;
  count: number;
}

export interface SummaryGraph {
  groups: GroupNode[];
  edges: SummaryEdge[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_GROUPS = 12;
const MIN_GROUPS_FOR_OVERVIEW = 4;

/** Keywords that identify external / third-party nodes */
const EXTERNAL_MARKERS = [
  'node_modules', 'gemini', 'github', 'octokit', 'axios', 'express',
  'mongoose', 'sequelize', 'prisma', 'typeorm', 'redis', 'stripe',
  'twilio', 'sendgrid', 'aws', 'firebase', 'supabase', 'jwt',
  'passport', 'bcrypt', 'crypto', 'nodemailer',
];

/** Frontend path fragments */
const FRONTEND_PATH_MARKERS = [
  'client/', 'frontend/', 'ui/', 'components/', 'pages/', 'views/',
  'src/app/', 'src/pages/', 'public/',
];

/** Human-readable folder labels */
const FOLDER_LABEL_MAP: Record<string, string> = {
  routes:      'Route Handlers',
  route:       'Route Handlers',
  controllers: 'Controllers',
  controller:  'Controllers',
  middleware:  'Middleware',
  middlewares: 'Middleware',
  models:      'Data Models',
  model:       'Data Models',
  services:    'Analysis Services',
  service:     'Analysis Services',
  config:      'Configuration',
  configs:     'Configuration',
  utils:       'Utilities',
  util:        'Utilities',
  helpers:     'Utilities',
  tests:       'Tests',
  test:        'Tests',
  '__tests__': 'Tests',
  spec:        'Tests',
  lib:         'Libraries',
  libs:        'Libraries',
  src:         'Source',
  app:         'Application',
};

/** Type → category mapping */
function typeToCategory(type: string, filePath: string): GroupCategory {
  const lType = type.toLowerCase();
  const lFile = filePath.toLowerCase();

  if (FRONTEND_PATH_MARKERS.some(m => lFile.includes(m))) return 'frontend';

  switch (lType) {
    case 'model':                 return 'data';
    case 'service':               return 'services';
    case 'route':
    case 'controller':
    case 'middleware':
    case 'entry':
    case 'system':
    case 'config':
    case 'util':
    case 'test':
    case 'directory':
    default:                      return 'backend';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the top-level folder of a file path */
function topLevelFolder(filePath: string): string | null {
  // Normalise to forward slashes and strip leading ./
  const p = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const parts = p.split('/');
  // Skip single-segment paths (file at root level)
  if (parts.length < 2) return null;
  return parts[0].toLowerCase();
}

/** Check if a node is "external" */
function isExternal(node: RawNode): boolean {
  const combined = (node.file + ' ' + node.label).toLowerCase();
  return EXTERNAL_MARKERS.some(m => combined.includes(m));
}

/** Count edges for a given node id */
function edgeDegree(nodeId: string, edges: RawEdge[]): number {
  return edges.filter(e => e.source === nodeId || e.target === nodeId).length;
}

/** Is the node a standalone (not to be grouped)? */
function isStandalone(node: RawNode, edges: RawEdge[]): boolean {
  return (
    node.type.toLowerCase() === 'entry' ||
    edgeDegree(node.id, edges) > 5
  );
}

/** Build a human-readable group label from a folder key */
function folderLabel(folder: string): string {
  return FOLDER_LABEL_MAP[folder] || capitalize(folder);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Build a GroupNode from a set of raw nodes */
function buildGroup(
  id: string,
  label: string,
  category: GroupCategory,
  nodes: RawNode[],
  edges: RawEdge[],
  isEntry = false,
): GroupNode {
  const nodeIds = nodes.map(n => n.id);
  const selfEdgeCount = edges.filter(
    e => nodeIds.includes(e.source) && nodeIds.includes(e.target)
  ).length;

  return {
    id,
    label,
    category,
    childCount: nodes.length,
    children: nodeIds,
    childDetails: nodes.map(n => ({
      id: n.id,
      label: n.label,
      role: n.type,
      file: n.file,
      githubUrl: n.githubUrl || undefined,
    })),
    selfEdgeCount,
    isEntry,
  };
}

// ---------------------------------------------------------------------------
// Main summarizer
// ---------------------------------------------------------------------------
export function summarizeGraph(raw: RawGraph): SummaryGraph & { tooSmall: boolean } {
  const { nodes, edges } = raw;

  if (nodes.length === 0) {
    return { groups: [], edges: [], tooSmall: true };
  }

  // Track which nodes have been assigned to a group
  const assigned = new Set<string>();
  const groups: GroupNode[] = [];

  // --- PASS 1: Externals → single "External Services" group ---
  const externals = nodes.filter(n => isExternal(n));
  if (externals.length > 0) {
    const g = buildGroup('grp_external', 'External Services', 'external', externals, edges);
    groups.push(g);
    externals.forEach(n => assigned.add(n.id));
  }

  // --- PASS 2: Standalones (entry points & high-degree nodes) ---
  const standalones = nodes.filter(n => !assigned.has(n.id) && isStandalone(n, edges));
  for (const node of standalones) {
    const category = typeToCategory(node.type, node.file);
    const g = buildGroup(
      `grp_standalone_${node.id}`,
      node.label,
      category,
      [node],
      edges,
      node.type.toLowerCase() === 'entry',
    );
    groups.push(g);
    assigned.add(node.id);
  }

  // --- PASS 3: Group by top-level folder ---
  const remaining = nodes.filter(n => !assigned.has(n.id));

  const folderBuckets = new Map<string, RawNode[]>();
  const noFolderNodes: RawNode[] = [];

  for (const node of remaining) {
    const folder = topLevelFolder(node.file);
    if (folder) {
      if (!folderBuckets.has(folder)) folderBuckets.set(folder, []);
      folderBuckets.get(folder)!.push(node);
    } else {
      noFolderNodes.push(node);
    }
  }

  for (const [folder, folderNodes] of folderBuckets.entries()) {
    // Determine category from the majority type in the folder
    const typeCounts: Record<string, number> = {};
    for (const n of folderNodes) {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    }
    const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
    const category = typeToCategory(dominantType, folderNodes[0].file);

    const g = buildGroup(
      `grp_folder_${folder}`,
      folderLabel(folder),
      category,
      folderNodes,
      edges,
    );
    groups.push(g);
    folderNodes.forEach(n => assigned.add(n.id));
  }

  // --- PASS 4: Remaining nodes grouped by type role ---
  const stillRemaining = noFolderNodes.filter(n => !assigned.has(n.id));
  const typeBuckets = new Map<string, RawNode[]>();

  for (const node of stillRemaining) {
    const t = node.type.toLowerCase();
    if (!typeBuckets.has(t)) typeBuckets.set(t, []);
    typeBuckets.get(t)!.push(node);
  }

  for (const [type, typeNodes] of typeBuckets.entries()) {
    const category = typeToCategory(type, typeNodes[0].file);
    const label = FOLDER_LABEL_MAP[type] || capitalize(type) + ' Modules';
    const g = buildGroup(`grp_type_${type}`, label, category, typeNodes, edges);
    groups.push(g);
    typeNodes.forEach(n => assigned.add(n.id));
  }

  // --- PASS 5: Overflow — collapse smallest groups into "Other" if > MAX_GROUPS ---
  let finalGroups = groups;

  if (groups.length > MAX_GROUPS) {
    // Sort by childCount ascending; protect externals and entry points
    const protected_ = groups.filter(g => g.isEntry || g.category === 'external');
    const collapsible = groups
      .filter(g => !g.isEntry && g.category !== 'external')
      .sort((a, b) => a.childCount - b.childCount);

    const overflow = collapsible.slice(0, collapsible.length - (MAX_GROUPS - protected_.length - 1));
    const kept = collapsible.slice(overflow.length);

    // Merge overflow into "Other"
    if (overflow.length > 0) {
      const otherNodes: RawNode[] = [];
      const otherNodeIds = new Set<string>();

      for (const g of overflow) {
        for (const childId of g.children) {
          const rawNode = nodes.find(n => n.id === childId);
          if (rawNode && !otherNodeIds.has(childId)) {
            otherNodes.push(rawNode);
            otherNodeIds.add(childId);
          }
        }
      }

      const otherGroup = buildGroup('grp_other', 'Other Modules', 'backend', otherNodes, edges);
      finalGroups = [...protected_, ...kept, otherGroup];
    }
  }

  // ---------------------------------------------------------------------------
  // Build a node-id → group-id lookup
  // ---------------------------------------------------------------------------
  const nodeToGroup: Record<string, string> = {};
  for (const g of finalGroups) {
    for (const childId of g.children) {
      nodeToGroup[childId] = g.id;
    }
  }

  // ---------------------------------------------------------------------------
  // Aggregate edges between groups
  // ---------------------------------------------------------------------------
  const edgeCountMap = new Map<string, number>();

  for (const e of edges) {
    const srcGroup = nodeToGroup[e.source];
    const tgtGroup = nodeToGroup[e.target];

    if (!srcGroup || !tgtGroup) continue;
    if (srcGroup === tgtGroup) continue; // intra-group — already counted as selfEdgeCount

    const key = `${srcGroup}→${tgtGroup}`;
    edgeCountMap.set(key, (edgeCountMap.get(key) || 0) + 1);
  }

  const summaryEdges: SummaryEdge[] = Array.from(edgeCountMap.entries()).map(([key, count]) => {
    const [source, target] = key.split('→');
    return { id: `sedge_${source}_${target}`, source, target, count };
  });

  // Deduplicate if bidirectional (prefer keeping both directions separate)
  const deduped = summaryEdges.filter((e, idx) => {
    const reverseKey = `${e.target}→${e.source}`;
    const reverseIdx = summaryEdges.findIndex(
      se => `${se.source}→${se.target}` === reverseKey
    );
    // Keep this edge if: no reverse exists, OR reverse has smaller index (keep later)
    return reverseIdx === -1 || reverseIdx >= idx;
  });

  const tooSmall = finalGroups.length < MIN_GROUPS_FOR_OVERVIEW;

  return { groups: finalGroups, edges: deduped, tooSmall };
}

// ---------------------------------------------------------------------------
// Category styling helpers — used by the component
// ---------------------------------------------------------------------------
export const CATEGORY_COLORS: Record<GroupCategory, {
  bg: string;
  border: string;
  accent: string;
  text: string;
  glow: string;
  badge: string;
  minimap: string;
}> = {
  frontend: {
    bg: 'bg-[#060f1e]',
    border: 'border-blue-500/50',
    accent: 'bg-blue-500',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_16px_rgba(59,130,246,0.2)]',
    badge: 'bg-blue-500/15 border-blue-500/40 text-blue-400',
    minimap: '#3b82f6',
  },
  backend: {
    bg: 'bg-[#0d0a1e]',
    border: 'border-violet-500/50',
    accent: 'bg-violet-500',
    text: 'text-violet-400',
    glow: 'shadow-[0_0_16px_rgba(139,92,246,0.2)]',
    badge: 'bg-violet-500/15 border-violet-500/40 text-violet-400',
    minimap: '#8b5cf6',
  },
  services: {
    bg: 'bg-[#071a12]',
    border: 'border-emerald-500/50',
    accent: 'bg-emerald-500',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_16px_rgba(16,185,129,0.2)]',
    badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    minimap: '#10b981',
  },
  data: {
    bg: 'bg-[#061a1a]',
    border: 'border-teal-500/50',
    accent: 'bg-teal-500',
    text: 'text-teal-400',
    glow: 'shadow-[0_0_16px_rgba(20,184,166,0.2)]',
    badge: 'bg-teal-500/15 border-teal-500/40 text-teal-400',
    minimap: '#14b8a6',
  },
  external: {
    bg: 'bg-[#1a130a]',
    border: 'border-amber-500/50',
    accent: 'bg-amber-500',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_16px_rgba(245,158,11,0.2)]',
    badge: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
    minimap: '#f59e0b',
  },
};
