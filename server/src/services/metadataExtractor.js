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
  if (lowerFilename === 'readme.md') return 'Introduces the project and explains how to run it.';
  if (lowerFilename === 'package.json') return 'Stores project information, dependencies and development commands.';
  if (lowerFilename === 'package-lock.json' || lowerFilename === 'yarn.lock' || lowerFilename === 'pnpm-lock.yaml') return 'Locks dependency versions for consistent installations.';
  if (lowerFilename === 'dockerfile') return 'Contains instructions for building a Docker container image.';
  if (lowerFilename === 'docker-compose.yml' || lowerFilename === 'docker-compose.yaml') return 'Defines and runs multi-container Docker applications.';
  if (lowerFilename === 'tsconfig.json') return 'Configures TypeScript compiler options for the project.';
  if (lowerFilename.startsWith('vite.config.')) return 'Configuration file for the Vite build tool and development server.';
  if (lowerFilename.startsWith('next.config.')) return 'Configuration settings for the Next.js framework.';
  if (lowerFilename.startsWith('tailwind.config.')) return 'Configuration for Tailwind CSS utility classes and design system.';
  if (lowerFilename === '.gitignore') return 'Specifies intentionally untracked files that Git should ignore.';
  if (lowerFilename === '.env') return 'Stores local environment variables and secrets.';
  if (lowerFilename === '.env.example') return 'Provides a template for required environment variables.';
  if (lowerFilename === 'license' || lowerFilename === 'license.md') return 'Specifies the legal license and terms of use for the project.';
  if (lowerFilename === 'favicon.ico') return 'The website icon displayed in the browser tab.';
  if (lowerFilename === 'index.html') return 'The main HTML entry point for the web application.';
  if (lowerFilename === 'robots.txt') return 'Tells web crawlers which pages they can or cannot request.';
  if (lowerFilename === 'manifest.json') return 'Provides metadata for Progressive Web Apps (PWA).';
  if (lowerFilename === 'requirements.txt') return 'Lists Python dependencies required for the project.';
  if (lowerFilename === 'cargo.toml') return 'Configuration and dependency manifest for Rust projects.';
  if (lowerFilename === 'pom.xml') return 'Configuration file for Maven-based Java projects.';

  // LEVEL 1: Media, binary, archives, fonts
  const ext = metadata.extension;
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'].includes(ext)) return "This image is used as part of the application's interface.";
  if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return "This video file is used within the application.";
  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return "This font file provides custom typography for the application.";
  if (['.zip', '.tar', '.gz', '.rar'].includes(ext)) return "Compressed archive file containing project resources.";
  if (ext === '.pdf') return "Portable Document Format file, likely containing documentation.";
  if (['.bin', '.exe', '.dll', '.so', '.dylib'].includes(ext)) return "Compiled binary executable or library file.";

  switch (role) {
    case 'Entry Point':
      if (metadata.framework === 'Express') {
        return `Main Express application entry point. ${majorImports ? `Initializes ${majorImports} and registers ${routeCount} API route groups.` : 'Initializes server and middleware.'}`;
      }
      if (metadata.framework === 'React') {
        return `Main React application entry point. Bootstraps the frontend application.`;
      }
      return `Main application entry point.`;

    case 'Express Route':
      return `Defines Express API routes. ${routeCount > 0 ? `Contains ${routeCount} HTTP endpoints.` : ''}`;

    case 'React Component':
      return `Reusable React UI component${majorImports ? ` utilizing ${majorImports}` : ''}.`;

    case 'React Hook':
      return `Custom React hook that manages application state or side effects.`;

    case 'Utility':
      return `Collection of helper functions used across the project.`;

    case 'Controller':
      return `Handles incoming HTTP requests and business logic.`;

    case 'Middleware':
      return `Express middleware responsible for intercepting requests and adding context or validation.`;

    case 'Database Model':
      return `Defines the database schema and data relationships.`;

    case 'Configuration':
      if (filename === 'package.json') return `Project manifest containing dependencies and script configurations.`;
      return `Application configuration and runtime settings.`;

    case 'Environment':
      return `Environment configuration file containing environment variables.`;

    case 'Service':
      return `Contains business logic and external API integrations${majorImports ? ` using ${majorImports}` : ''}.`;

    case 'Parser':
      return `Responsible for AST parsing and metadata extraction.`;

    case 'Documentation':
      return `Project documentation and setup instructions.`;

    default:
      if (filename.endsWith('.json')) return 'JSON data or configuration file.';
      if (filename.endsWith('.md')) return 'Markdown documentation file.';
      if (metadata.extension === '.css') return 'Stylesheet defining visual styles.';
      return `Project source file.`;
  }
}

module.exports = {
  extractMetadata,
  generateDeterministicDescription
};
