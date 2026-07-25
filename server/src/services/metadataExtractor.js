const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');

function extractMetadata(fileContent, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);
  
  const metadata = {
    path: filePath,
    filename,
    extension,
    role: 'Unknown',
    imports: [],
    exports: [],
    functions: 0,
    classes: 0,
    routeCount: 0,
    middlewareCount: 0,
    linesOfCode: fileContent.split('\n').length,
    entryPoint: false,
    framework: 'None',
    description: ''
  };

  const isJsTs = ['.js', '.jsx', '.ts', '.tsx'].includes(extension);

  if (isJsTs) {
    try {
      const isTs = ['.ts', '.tsx'].includes(extension);
      const isJsx = ['.jsx', '.tsx'].includes(extension);
      
      const ast = parser.parse(fileContent, {
        sourceType: 'module',
        plugins: [
          isTs ? 'typescript' : null,
          isJsx ? 'jsx' : null,
          'decorators-legacy'
        ].filter(Boolean),
        errorRecovery: true
      });

      let hasReactImport = false;
      let hasExpressImport = false;

      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          metadata.imports.push(source);
          if (source.includes('react')) hasReactImport = true;
          if (source.includes('express')) hasExpressImport = true;
        },
        CallExpression(path) {
          if (path.node.callee.name === 'require') {
            if (path.node.arguments[0] && path.node.arguments[0].value) {
              const source = path.node.arguments[0].value;
              metadata.imports.push(source);
              if (source.includes('react')) hasReactImport = true;
              if (source.includes('express')) hasExpressImport = true;
            }
          }
          
          // Detect routes (app.get, router.post, etc)
          if (path.node.callee.type === 'MemberExpression') {
            const propName = path.node.callee.property.name;
            if (['get', 'post', 'put', 'delete', 'patch'].includes(propName)) {
              if (path.node.callee.object.name === 'app' || path.node.callee.object.name === 'router') {
                metadata.routeCount++;
              }
            }
            if (propName === 'use') {
               metadata.middlewareCount++;
            }
          }
        },
        FunctionDeclaration() {
          metadata.functions++;
        },
        ArrowFunctionExpression() {
          metadata.functions++;
        },
        ClassDeclaration() {
          metadata.classes++;
        },
        ExportDefaultDeclaration() {
          metadata.exports.push('default');
        },
        ExportNamedDeclaration(path) {
          if (path.node.declaration && path.node.declaration.declarations) {
            path.node.declaration.declarations.forEach(d => {
              if (d.id && d.id.name) metadata.exports.push(d.id.name);
            });
          }
        }
      });

      // Unique imports
      metadata.imports = [...new Set(metadata.imports)];

      if (hasReactImport || isJsx) metadata.framework = 'React';
      if (hasExpressImport || metadata.routeCount > 0) metadata.framework = 'Express';

    } catch (e) {
      console.warn(`AST Parse failed for ${filePath}:`, e.message);
    }
  }

  metadata.role = determineRole(filePath, metadata);
  if (['index.js', 'app.js', 'main.tsx', 'server.js', 'main.ts', 'index.ts'].includes(filename)) {
    metadata.entryPoint = true;
    if (metadata.role === 'Unknown') metadata.role = 'Entry Point';
  }

  metadata.description = generateDeterministicDescription(metadata);

  return metadata;
}

function determineRole(filePath, metadata) {
  const p = filePath.toLowerCase();
  if (p.includes('route') || p.includes('controller') && metadata.routeCount > 0) return 'Express Route';
  if (p.includes('component') || (metadata.framework === 'React' && metadata.exports.includes('default'))) return 'React Component';
  if (p.includes('hook') || p.match(/use[A-Z]\w+\.(js|ts)/)) return 'React Hook';
  if (p.includes('util') || p.includes('helper')) return 'Utility';
  if (p.includes('controller')) return 'Controller';
  if (p.includes('middleware')) return 'Middleware';
  if (p.includes('model') || p.includes('schema')) return 'Database Model';
  if (p.includes('config')) return 'Configuration';
  if (p.includes('service')) return 'Service';
  if (p.includes('parser') || p.includes('extract')) return 'Parser';
  
  if (p.includes('.env')) return 'Environment';
  if (p.includes('package.json')) return 'Configuration';
  if (p.includes('readme.md')) return 'Documentation';

  if (['index.js', 'app.js', 'main.tsx', 'server.js', 'main.ts', 'index.ts'].includes(metadata.filename)) {
    return 'Entry Point';
  }

  return 'Unknown';
}

function generateDeterministicDescription(metadata) {
  const { role, filename, imports, routeCount } = metadata;
  const majorImports = imports.slice(0, 3).map(i => i.split('/').pop()).join(', ');
  const lowerFilename = filename.toLowerCase();

  // LEVEL 1: Specific Files
  if (lowerFilename === 'readme.md') return 'Main project documentation covering setup steps, overview, and usage instructions.';
  if (lowerFilename === 'package.json') return 'NPM manifest defining project dependencies, scripts, and package settings.';
  if (lowerFilename === 'package-lock.json' || lowerFilename === 'yarn.lock' || lowerFilename === 'pnpm-lock.yaml') return 'Locked dependency tree ensuring consistent installations across environments.';
  if (lowerFilename === 'dockerfile') return 'Docker container image configuration and build instructions.';
  if (lowerFilename === 'docker-compose.yml' || lowerFilename === 'docker-compose.yaml') return 'Multi-container Docker application setup for local services.';
  if (lowerFilename === 'tsconfig.json') return 'TypeScript compiler options and type-checking rules.';
  if (lowerFilename.startsWith('vite.config.')) return 'Vite development server and bundler configuration.';
  if (lowerFilename.startsWith('next.config.')) return 'Next.js framework configuration and build settings.';
  if (lowerFilename.startsWith('tailwind.config.')) return 'Tailwind CSS design tokens and theme settings.';
  if (lowerFilename === '.gitignore') return 'Git ignore rules for untracked build artifacts and credentials.';
  if (lowerFilename === '.env') return 'Local environment variables and runtime secrets.';
  if (lowerFilename === '.env.example') return 'Environment variable template listing required configuration keys.';
  if (lowerFilename === 'license' || lowerFilename === 'license.md') return 'Open-source software license and usage terms.';
  if (lowerFilename === 'favicon.ico') return 'Browser favicon asset.';
  if (lowerFilename === 'index.html') return 'Main HTML entry point for the application user interface.';
  if (lowerFilename === 'robots.txt') return 'Search engine crawler rules.';
  if (lowerFilename === 'manifest.json') return 'Progressive Web App manifest and application metadata.';
  if (lowerFilename === 'requirements.txt') return 'Python package dependencies list.';
  if (lowerFilename === 'cargo.toml') return 'Rust project configuration and dependencies.';
  if (lowerFilename === 'pom.xml') return 'Maven build and dependency configuration for Java.';

  // LEVEL 1: Media, binary, archives, fonts
  const ext = metadata.extension;
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'].includes(ext)) return "User interface image asset.";
  if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return "Media video file.";
  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return "Custom web font asset.";
  if (['.zip', '.tar', '.gz', '.rar'].includes(ext)) return "Compressed resource archive.";
  if (ext === '.pdf') return "Document file.";
  if (['.bin', '.exe', '.dll', '.so', '.dylib'].includes(ext)) return "Compiled binary executable or library.";

  switch (role) {
    case 'Entry Point':
      if (metadata.framework === 'Express') {
        return `Express server entry point initializing the web server${majorImports ? ` and importing ${majorImports}` : ''}${routeCount > 0 ? ` with ${routeCount} active routes` : ''}.`;
      }
      if (metadata.framework === 'React') {
        return `Frontend entry point mounting the main React component tree.`;
      }
      return `Main application entry point.`;

    case 'Express Route':
      return `Express API route handlers${routeCount > 0 ? ` for ${routeCount} endpoints` : ''}.`;

    case 'React Component':
      return `React user interface component${majorImports ? ` built using ${majorImports}` : ''}.`;

    case 'React Hook':
      return `Custom React hook managing component state or side effects.`;

    case 'Utility':
      return `Utility functions for data formatting and helper logic.`;

    case 'Controller':
      return `Request controller handling business logic and API responses.`;

    case 'Middleware':
      return `Express middleware for request parsing, validation, or authentication.`;

    case 'Database Model':
      return `Database model defining schema structures and query methods.`;

    case 'Configuration':
      if (filename === 'package.json') return `NPM manifest defining project dependencies and scripts.`;
      return `Application runtime and build configuration.`;

    case 'Environment':
      return `Environment configuration file.`;

    case 'Service':
      return `Service module for core business logic${majorImports ? ` integrating ${majorImports}` : ''}.`;

    case 'Parser':
      return `AST parser and code metadata extractor module.`;

    case 'Documentation':
      return `Project documentation file.`;

    default:
      if (filename.endsWith('.json')) return 'JSON configuration or data file.';
      if (filename.endsWith('.md')) return 'Markdown documentation file.';
      if (metadata.extension === '.css') return 'CSS stylesheet for UI styling.';
      return `Source code file.`;
  }
}

module.exports = {
  extractMetadata,
  generateDeterministicDescription
};
