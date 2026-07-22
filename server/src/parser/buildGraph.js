/**
 * Build a dependency graph from extracted analysis data.
 * Creates nodes and edges for visualization with ReactFlow.
 */

function buildGraph(entryPoint, routes, envVars, apis, fileRoles) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();

  // Helper to add a node safely
  function addNode(id, type, label, file, line) {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({
      id,
      type,
      label,
      file: file || null,
      line: line || null,
      githubUrl: null,
      metadata: {}
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

  // 1. Entry Point Node
  if (entryPoint && entryPoint.file) {
    addNode(`entry:${entryPoint.file}`, 'entry', `${entryPoint.file} (entry)`, entryPoint.file, entryPoint.line);
  }

  // 2. Route Nodes — group by file to reduce clutter
  const routesByFile = {};
  for (const route of routes) {
    if (!routesByFile[route.file]) {
      routesByFile[route.file] = [];
    }
    routesByFile[route.file].push(route);
  }

  for (const [file, fileRoutes] of Object.entries(routesByFile)) {
    const nodeId = `route:${file}`;
    const paths = fileRoutes.map(r => `${r.method} ${r.path}`).slice(0, 3);
    const label = paths.join(', ') + (fileRoutes.length > 3 ? ` +${fileRoutes.length - 3} more` : '');
    addNode(nodeId, 'route', label, file, fileRoutes[0].line);

    // Connect entry -> route file
    if (entryPoint && entryPoint.file) {
      addEdge(`entry:${entryPoint.file}`, nodeId, 'mounts route');
    }

    // Connect route -> env vars
    for (const route of fileRoutes) {
      for (const envName of (route.usesEnvVars || [])) {
        const envNodeId = `env:${envName}`;
        addNode(envNodeId, 'envVar', envName, null, null);
        addEdge(nodeId, envNodeId, 'reads');
      }
      
      // Connect route -> apis
      for (const apiPkg of (route.usesApis || [])) {
        const apiNodeId = `api:${apiPkg}`;
        if (nodeIds.has(apiNodeId)) {
          addEdge(nodeId, apiNodeId, 'uses');
        }
      }
    }
  }

  // 3. API/Package Nodes
  const apisByCategory = {};
  for (const api of apis) {
    // Skip testing, config, utility categories for graph clarity
    if (['testing', 'config', 'utility', 'styling'].includes(api.category)) continue;
    
    const nodeId = `api:${api.package}`;
    addNode(nodeId, 'api', api.name || api.package, api.importFile, api.importLine);

    if (!apisByCategory[api.category]) {
      apisByCategory[api.category] = [];
    }
    apisByCategory[api.category].push(api);
  }

  // 4. Model Nodes (from fileRoles)
  for (const fileRole of fileRoles) {
    if (fileRole.role === 'model') {
      const modelName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx|py|go|rb)$/, '');
      const nodeId = `model:${modelName}`;
      addNode(nodeId, 'model', `${capitalize(modelName)} Model`, fileRole.file, 1);

      // Connect models to database APIs
      for (const api of apis) {
        if (api.category === 'database' && api.importFile === fileRole.file) {
          addEdge(nodeId, `api:${api.package}`, 'uses');
        }
      }
    }
  }

  // 5. Env Var Nodes (not already added from routes)
  for (const envVar of envVars) {
    const nodeId = `env:${envVar.name}`;
    addNode(nodeId, 'envVar', envVar.name, envVar.file, envVar.line);

    // Connect entry point to critical env vars
    if (entryPoint && entryPoint.file && envVar.file === entryPoint.file) {
      addEdge(`entry:${entryPoint.file}`, nodeId, 'reads');
    }
  }

  // 6. Middleware Nodes (from fileRoles)
  for (const fileRole of fileRoles) {
    if (fileRole.role === 'middleware') {
      const mwName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx)$/, '');
      const nodeId = `middleware:${mwName}`;
      addNode(nodeId, 'middleware', `${capitalize(mwName)} (middleware)`, fileRole.file, 1);

      // Connect entry -> middleware
      if (entryPoint && entryPoint.file) {
        addEdge(`entry:${entryPoint.file}`, nodeId, 'uses');
      }
    }
  }

  // 7. Service Nodes
  for (const fileRole of fileRoles) {
    if (fileRole.role === 'service') {
      const svcName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx)$/, '');
      const nodeId = `service:${svcName}`;
      addNode(nodeId, 'service', `${capitalize(svcName)} Service`, fileRole.file, 1);
    }
  }

  // 8. Connect route files to models/services they import
  for (const file of Object.keys(routesByFile)) {
    const routeNodeId = `route:${file}`;
    for (const fileRole of fileRoles) {
      if (fileRole.role === 'model') {
        const modelName = fileRole.file.split('/').pop().replace(/\.(js|ts|jsx|tsx|py|go|rb)$/, '');
        addEdge(routeNodeId, `model:${modelName}`, 'queries');
      }
    }
  }

  return { nodes, edges };
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { buildGraph };
