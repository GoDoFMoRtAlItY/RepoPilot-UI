/**
 * Detect the entry point of a repository by analyzing package.json and file structure.
 */

const COMMON_ENTRY_FILES = [
  'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js',
  'src/app.ts', 'src/app.js', 'src/server.ts', 'src/server.js',
  'index.ts', 'index.js', 'app.ts', 'app.js',
  'server.ts', 'server.js', 'main.ts', 'main.js',
  'lib/index.js', 'lib/index.ts',
  'bin/www', 'bin/server.js',
  'manage.py', 'app.py', 'main.py', 'wsgi.py',
  'main.go', 'cmd/main.go', 'cmd/server/main.go',
  'config.ru', 'app/app.rb',
  'src/main/java/Application.java'
];

function detectEntryPoint(filesWithContent, packageJson) {
  const filePaths = filesWithContent.map(f => f.path);

  // 1. Check package.json scripts first (highest confidence)
  if (packageJson) {
    // Check scripts.start
    if (packageJson.scripts) {
      const startScript = packageJson.scripts.start || '';
      const devScript = packageJson.scripts.dev || '';
      
      // Parse "node src/index.js" or "ts-node src/index.ts" or "nodemon app.js"
      for (const script of [startScript, devScript]) {
        const match = script.match(/(?:node|ts-node|nodemon|tsx|npx\s+ts-node)\s+([^\s&|;]+)/);
        if (match) {
          const entryFile = match[1].replace(/^\.\//, '');
          if (filePaths.includes(entryFile)) {
            return {
              file: entryFile,
              line: 1,
              confidence: 'high',
              reason: `package.json scripts points to "${entryFile}"`,
              githubUrl: ''
            };
          }
        }
      }
    }

    // Check package.json "main" field
    if (packageJson.main) {
      const mainFile = packageJson.main.replace(/^\.\//, '');
      if (filePaths.includes(mainFile)) {
        return {
          file: mainFile,
          line: 1,
          confidence: 'high',
          reason: `package.json "main" field points to "${mainFile}"`,
          githubUrl: ''
        };
      }
    }
  }

  // 2. Check for Python projects
  const managePy = filePaths.find(f => f === 'manage.py');
  if (managePy) {
    return {
      file: 'manage.py',
      line: 1,
      confidence: 'high',
      reason: 'Django project detected (manage.py)',
      githubUrl: ''
    };
  }

  // 3. Check for Go projects
  const mainGo = filePaths.find(f => f === 'main.go' || f.endsWith('/main.go'));
  if (mainGo) {
    // Verify it contains package main
    const goFile = filesWithContent.find(f => f.path === mainGo);
    if (goFile && goFile.content.includes('package main')) {
      return {
        file: mainGo,
        line: 1,
        confidence: 'high',
        reason: 'Go main package detected',
        githubUrl: ''
      };
    }
  }

  // 4. Check common entry file paths
  for (const commonFile of COMMON_ENTRY_FILES) {
    if (filePaths.includes(commonFile)) {
      return {
        file: commonFile,
        line: 1,
        confidence: 'medium',
        reason: `Common entry file pattern: "${commonFile}"`,
        githubUrl: ''
      };
    }
  }

  // 5. Heuristic: look for files that contain .listen() or createServer
  for (const file of filesWithContent) {
    if (file.path.endsWith('.js') || file.path.endsWith('.ts')) {
      if (file.content.match(/\.(listen|createServer)\s*\(/)) {
        return {
          file: file.path,
          line: 1,
          confidence: 'medium',
          reason: `File contains server initialization (.listen() or createServer)`,
          githubUrl: ''
        };
      }
    }
  }

  // 6. Fallback
  const firstJsFile = filePaths.find(f => f.endsWith('.js') || f.endsWith('.ts'));
  return {
    file: firstJsFile || 'index.js',
    line: 1,
    confidence: 'low',
    reason: 'Fallback — no clear entry point detected',
    githubUrl: ''
  };
}

module.exports = { detectEntryPoint };
