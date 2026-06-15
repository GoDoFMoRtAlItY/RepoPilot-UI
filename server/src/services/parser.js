const { initParser, parseFile } = require('../parser/treeSitter');
const { extractRoutes } = require('../parser/extractRoutes');
const { extractEnvVars } = require('../parser/extractEnvVars');
const { extractApis } = require('../parser/extractApis');
const { detectEntryPoint } = require('../parser/detectEntryPoint');
const { classifyFiles } = require('../parser/classifyFiles');
const { buildGraph } = require('../parser/buildGraph');
const { generateSetup } = require('../parser/generateSetup');
const { scanSecurity } = require('../parser/securityScanner');
const { calculateScore } = require('../parser/scoreCalculator');
const { buildGithubUrl } = require('../utils/githubUrl');

let parserInitialized = false;

/**
 * Main orchestrator for analyzing a repository
 */
async function analyzeRepo(owner, repo, filesWithContent, meta) {
  // Ensure Tree-sitter is initialized (only happens once)
  if (!parserInitialized) {
    try {
      await initParser();
      parserInitialized = true;
    } catch (err) {
      console.warn('Failed to initialize Tree-sitter parser:', err.message);
      // We will gracefully degrade to returning empty arrays
    }
  }

  const routes = [];
  const envVars = [];
  const apis = [];
  let entryPoint = { file: 'app.js', line: 1, confidence: 'low', reason: 'Fallback', githubUrl: '' };
  const fileRoles = [];
  let graph = { nodes: [], edges: [] };
  let setupSteps = [];
  let securityAlerts = [];
  let onboardingScore = { score: 50, breakdown: [] };

  try {
    // 1. Process files
    // Find package.json for some heuristics
    const pkgJsonFile = filesWithContent.find(f => f.path === 'package.json');
    let packageJson = null;
    if (pkgJsonFile) {
      try {
        packageJson = JSON.parse(pkgJsonFile.content);
      } catch (e) {
        console.warn('Invalid package.json');
      }
    }

    // 2. Classify files (no AST needed, mostly path based)
    try {
      const classified = classifyFiles(filesWithContent);
      fileRoles.push(...(classified || []));
    } catch (e) {
      console.warn('classifyFiles failed:', e.message);
    }

    // 3. Detect Entry Point
    try {
      entryPoint = detectEntryPoint(filesWithContent, packageJson) || entryPoint;
    } catch (e) {
      console.warn('detectEntryPoint failed:', e.message);
    }

    // 4. Security Scan
    try {
      const alerts = scanSecurity(filesWithContent, packageJson);
      securityAlerts.push(...(alerts || []));
    } catch (e) {
      console.warn('scanSecurity failed:', e.message);
    }

    // 5. AST Parsing per file
    const jsTsFiles = filesWithContent.filter(f => 
      f.path.endsWith('.js') || f.path.endsWith('.jsx') || 
      f.path.endsWith('.ts') || f.path.endsWith('.tsx')
    );

    for (const file of jsTsFiles) {
      try {
        const lang = (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) ? 'typescript' : 'javascript';
        const tree = parseFile ? await parseFile(file.content, lang) : null;

        if (tree) {
          // Extract Apis
          const fileApis = extractApis(tree, file.content, file.path, require('../parser/lookups/apiPackages.json')) || [];
          apis.push(...fileApis);

          // Extract Env Vars
          const fileEnvVars = extractEnvVars(tree, file.content, file.path) || [];
          envVars.push(...fileEnvVars);

          // Extract Routes
          const fileRoutes = extractRoutes(tree, file.content, file.path, fileEnvVars, fileApis) || [];
          routes.push(...fileRoutes);

          if (typeof tree.delete === 'function') {
            tree.delete(); // Free memory
          }
        }
      } catch (err) {
        console.warn(`AST Parsing failed for ${file.path}:`, err.message);
      }
    }

    // 6. Generate Setup Steps
    try {
      setupSteps = generateSetup(packageJson, envVars, `https://github.com/${owner}/${repo}`) || [];
    } catch (e) {
      console.warn('generateSetup failed:', e.message);
    }

    // 7. Graph Builder
    try {
      graph = buildGraph(entryPoint, routes, envVars, apis, fileRoles) || graph;
    } catch (e) {
      console.warn('buildGraph failed:', e.message);
    }

    // 8. Score Calculation
    try {
      onboardingScore = calculateScore(filesWithContent, packageJson, envVars, routes, entryPoint) || onboardingScore;
    } catch (e) {
      console.warn('calculateScore failed:', e.message);
    }

  } catch (error) {
    console.error('Orchestrator error:', error.message);
  }

  // Enhance all paths with githubUrls
  const attachUrl = (item) => ({
    ...item,
    githubUrl: buildGithubUrl(owner, repo, meta.commitSha, item.file || item.importFile || item.path, item.line || item.importLine)
  });

  return {
    meta,
    summary: {
      totalFiles: filesWithContent.length,
      analyzedFiles: jsTsFiles.length,
      projectType: "Express.js API",
      oneLiner: "A repository analyzed by RepoPilot.",
    },
    entryPoint: attachUrl(entryPoint),
    setupSteps,
    envVars: envVars.map(attachUrl),
    routes: routes.map(attachUrl),
    apis: apis.map(attachUrl),
    fileRoles: fileRoles.map(attachUrl),
    graph: {
      nodes: graph.nodes.map(n => ({
        ...n,
        githubUrl: n.file ? buildGithubUrl(owner, repo, meta.commitSha, n.file, n.line) : null
      })),
      edges: graph.edges
    },
    onboardingScore,
    securityAlerts: securityAlerts.map(attachUrl)
  };
}

module.exports = {
  analyzeRepo
};
