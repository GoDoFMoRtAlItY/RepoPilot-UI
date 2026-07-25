/**
 * Build a dependency graph from extracted analysis data.
 * Creates nodes and edges for visualization with ReactFlow.
 * Prioritizes important architectural nodes and eliminates noise (env vars, third-party packages, cartesian joins).
 */

function buildGraph(entryPoint, routes, envVars, apis, fileRoles, filesWithContent = []) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();

  // Create lookup map for file contents to enable smart import detection
  const contentMap = {};
  if (Array.isArray(filesWithContent)) {
    for (const f of filesWithContent) {
      if (f && f.path && f.content) {
        contentMap[f.path] = f.content;
      }
    }
  }

  // Helper to add a node safely with priority score
  function addNode(id, type, label, file, line, priority = 3) {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({
      id,
      type,
      label,
      file: file || null,
      line: line || null,
      priority,
      githubUrl: null,
      metadata: { priority }
    });
  }

  // Helper to add an edge safely
  function addEdge(source, target, label) {
    if (!nodeIds.has(source) || !nodeIds.has(target)) return;
    if (source === target) return;
    const id = `${source}->${target}`;
    // Avoid duplicate edges
    if (edges.find(e => e.id === id)) return;
    edges.push({ id, source, target, label });
  }

  // 1. Entry Point Node (Critical - Priority 5)
  if (entryPoint && entryPoint.file) {
    addNode(`entry:${entryPoint.file}`, 'entry', `${entryPoint.file} (Entry Point)`, entryPoint.file, entryPoint.line, 5);
  }

  // 2. Route Nodes — group by file to reduce clutter (High - Priority 4)
  const routesByFile = {};
  for (const route of (routes || [])) {
    if (!routesByFile[route.file]) {
      routesByFile[route.file] = [];
    }
    routesByFile[route.file].push(route);
  }

  for (const [file, fileRoutes] of Object.entries(routesByFile)) {
    const nodeId = `route:${file}`;
    const paths = fileRoutes.map(r => `${r.method} ${r.path}`).slice(0, 3);
    const label = paths.join(', ') + (fileRoutes.length > 3 ? ` +${fileRoutes.length - 3} more` : '');
    addNode(nodeId, 'route', label, file, fileRoutes[0].line, 4);

    // Connect entry -> route file
    if (entryPoint && entryPoint.file) {
      addEdge(`entry:${entryPoint.file}`, nodeId, 'mounts route');
    }
  }

  // 3. Middleware Nodes (High - Priority 4)
  const middlewareNodes = [];
  for (const fileRole of (fileRoles || [])) {
    if (fileRole.role === 'middleware') {
      const mwName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx)$/, '');
      const nodeId = `middleware:${mwName}`;
      addNode(nodeId, 'middleware', `${capitalize(mwName)} (Middleware)`, fileRole.file, 1, 4);
      middlewareNodes.push({ id: nodeId, name: mwName, file: fileRole.file });

      // Connect entry -> middleware
      if (entryPoint && entryPoint.file) {
        addEdge(`entry:${entryPoint.file}`, nodeId, 'uses middleware');
      }
    }
  }

  // 4. Service Nodes (Medium - Priority 3)
  const serviceNodes = [];
  for (const fileRole of (fileRoles || [])) {
    if (fileRole.role === 'service') {
      const svcName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx)$/, '');
      const nodeId = `service:${svcName}`;
      addNode(nodeId, 'service', `${capitalize(svcName)} Service`, fileRole.file, 1, 3);
      serviceNodes.push({ id: nodeId, name: svcName, file: fileRole.file });
    }
  }

  // 5. Model Nodes (Medium - Priority 3)
  const modelNodes = [];
  for (const fileRole of (fileRoles || [])) {
    if (fileRole.role === 'model') {
      const modelName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx|py|go|rb)$/, '');
      const nodeId = `model:${modelName}`;
      addNode(nodeId, 'model', `${capitalize(modelName)} Model`, fileRole.file, 1, 3);
      modelNodes.push({ id: nodeId, name: modelName, file: fileRole.file });
    }
  }

  // 6. Config & Utility Nodes (Low - Priority 2)
  for (const fileRole of (fileRoles || [])) {
    if (fileRole.role === 'config') {
      const cfgName = fileRole.file.split('/').pop();
      addNode(`config:${cfgName}`, 'config', cfgName, fileRole.file, 1, 2);
    } else if (fileRole.role === 'utility') {
      const utilName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx)$/, '');
      addNode(`util:${utilName}`, 'util', `${capitalize(utilName)} Util`, fileRole.file, 1, 2);
    }
  }

  // 7. Smart Dependency Edges based on imports and file content references
  // Connect Route -> Service, Route -> Model, Route -> Middleware
  for (const [routeFile, _] of Object.entries(routesByFile)) {
    const routeNodeId = `route:${routeFile}`;
    const content = contentMap[routeFile] || '';

    // Check Service imports
    for (const svc of serviceNodes) {
      if (referencesModule(content, svc.name, svc.file)) {
        addEdge(routeNodeId, svc.id, 'calls');
      }
    }

    // Check Model imports (replacing old cartesian join!)
    for (const mod of modelNodes) {
      if (referencesModule(content, mod.name, mod.file)) {
        addEdge(routeNodeId, mod.id, 'queries');
      }
    }

    // Check Middleware imports
    for (const mw of middlewareNodes) {
      if (referencesModule(content, mw.name, mw.file)) {
        addEdge(routeNodeId, mw.id, 'uses middleware');
      }
    }
  }

  // Connect Service -> Model
  for (const svc of serviceNodes) {
    const content = contentMap[svc.file] || '';
    for (const mod of modelNodes) {
      if (referencesModule(content, mod.name, mod.file)) {
        addEdge(svc.id, mod.id, 'reads/writes');
      }
    }
  }

  // If there are services but no explicit route->service connections detected, check entry point
  if (entryPoint && entryPoint.file) {
    const entryContent = contentMap[entryPoint.file] || '';
    for (const svc of serviceNodes) {
      if (referencesModule(entryContent, svc.name, svc.file)) {
        addEdge(`entry:${entryPoint.file}`, svc.id, 'initializes');
      }
    }
  }

  // 8. Filter out orphan nodes (nodes with 0 edges, except entry point and routes)
  const connectedNodeIds = new Set();
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  const finalNodes = nodes.filter(node => {
    if (node.type === 'entry' || node.type === 'route') return true;
    return connectedNodeIds.has(node.id);
  });

  // Filter edges to ensure both source and target exist in finalNodes
  const finalNodeIds = new Set(finalNodes.map(n => n.id));
  const finalEdges = edges.filter(e => finalNodeIds.has(e.source) && finalNodeIds.has(e.target));

  return { nodes: finalNodes, edges: finalEdges };
}

/**
 * Check if code content imports or references a module/file name
 */
function referencesModule(content, moduleName, filePath) {
  if (!content || !moduleName) return false;
  // Check exact module name word boundary
  const nameRegex = new RegExp(`\\b${escapeRegExp(moduleName)}\\b`, 'i');
  if (nameRegex.test(content)) return true;
  // Check filename reference in import/require
  if (filePath) {
    const baseName = filePath.split('/').pop().replace(/\.(js|ts|jsx|tsx|py|go|rb)$/, '');
    if (baseName && content.includes(baseName)) return true;
  }
  return false;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { buildGraph };
