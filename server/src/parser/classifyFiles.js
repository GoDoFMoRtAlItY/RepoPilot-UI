/**
 * Classify files into roles based on path patterns and content heuristics.
 */

const ROLE_PATTERNS = [
  // Routes / Controllers
  { pattern: /(?:^|\/)routes?\//, role: 'route' },
  { pattern: /(?:^|\/)controllers?\//, role: 'controller' },
  { pattern: /(?:^|\/)handlers?\//, role: 'controller' },
  { pattern: /(?:^|\/)api\//, role: 'route' },
  { pattern: /(?:^|\/)endpoints?\//, role: 'route' },

  // Models / Schemas
  { pattern: /(?:^|\/)models?\//, role: 'model' },
  { pattern: /(?:^|\/)schemas?\//, role: 'model' },
  { pattern: /(?:^|\/)entities?\//, role: 'model' },

  // Middleware
  { pattern: /(?:^|\/)middlewares?\//, role: 'middleware' },
  { pattern: /(?:^|\/)interceptors?\//, role: 'middleware' },

  // Config
  { pattern: /(?:^|\/)config\//, role: 'config' },
  { pattern: /(?:^|\/)settings?\//, role: 'config' },
  { pattern: /\.config\.(js|ts|json|mjs|cjs)$/, role: 'config' },
  { pattern: /(?:^|\/)\.env/, role: 'config' },

  // Services / Business Logic
  { pattern: /(?:^|\/)services?\//, role: 'service' },
  { pattern: /(?:^|\/)providers?\//, role: 'service' },

  // Utilities
  { pattern: /(?:^|\/)utils?\//, role: 'utility' },
  { pattern: /(?:^|\/)helpers?\//, role: 'utility' },
  { pattern: /(?:^|\/)lib\//, role: 'utility' },

  // Tests
  { pattern: /(?:^|\/)tests?\//, role: 'test' },
  { pattern: /(?:^|\/)__tests__\//, role: 'test' },
  { pattern: /\.test\.(js|ts|jsx|tsx)$/, role: 'test' },
  { pattern: /\.spec\.(js|ts|jsx|tsx)$/, role: 'test' },

  // Frontend Components
  { pattern: /(?:^|\/)components?\//, role: 'component' },
  { pattern: /(?:^|\/)views?\//, role: 'view' },
  { pattern: /(?:^|\/)pages?\//, role: 'page' },
  { pattern: /(?:^|\/)layouts?\//, role: 'layout' },
  { pattern: /(?:^|\/)screens?\//, role: 'view' },

  // Styles
  { pattern: /\.(css|scss|sass|less|styl)$/, role: 'style' },

  // Migrations / Seeds
  { pattern: /(?:^|\/)migrations?\//, role: 'migration' },
  { pattern: /(?:^|\/)seeds?\//, role: 'seed' },

  // Types / Interfaces
  { pattern: /(?:^|\/)types?\//, role: 'types' },
  { pattern: /(?:^|\/)interfaces?\//, role: 'types' },
  { pattern: /\.d\.ts$/, role: 'types' },

  // Store / State
  { pattern: /(?:^|\/)store\//, role: 'store' },
  { pattern: /(?:^|\/)redux\//, role: 'store' },
  { pattern: /(?:^|\/)slices?\//, role: 'store' },

  // Hooks (React)
  { pattern: /(?:^|\/)hooks?\//, role: 'hook' },

  // Scripts / CLI
  { pattern: /(?:^|\/)scripts?\//, role: 'script' },
  { pattern: /(?:^|\/)bin\//, role: 'script' },
  { pattern: /(?:^|\/)cli\//, role: 'script' },

  // Documentation
  { pattern: /(?:^|\/)docs?\//, role: 'documentation' },
  { pattern: /README/i, role: 'documentation' },
  { pattern: /CONTRIBUTING/i, role: 'documentation' },
  { pattern: /CHANGELOG/i, role: 'documentation' },

  // Package / Dependency files
  { pattern: /^package\.json$/, role: 'package' },
  { pattern: /^tsconfig/, role: 'config' },
  { pattern: /^Dockerfile/i, role: 'devops' },
  { pattern: /^docker-compose/i, role: 'devops' },
  { pattern: /\.ya?ml$/, role: 'config' },
  { pattern: /^Makefile$/, role: 'script' },
  { pattern: /^Procfile$/, role: 'devops' },
];

function classifyFiles(filesWithContent) {
  const classified = [];

  for (const file of filesWithContent) {
    let role = 'unknown';

    // Try path-based classification
    for (const { pattern, role: matchRole } of ROLE_PATTERNS) {
      if (pattern.test(file.path)) {
        role = matchRole;
        break;
      }
    }

    // Content-based fallback for unknown files
    if (role === 'unknown' && file.content) {
      if (file.path.endsWith('.js') || file.path.endsWith('.ts')) {
        const content = file.content.substring(0, 2000); // Check first 2KB

        if (content.match(/router\.(get|post|put|delete|patch)\s*\(/)) {
          role = 'route';
        } else if (content.match(/module\.exports\s*=\s*(?:mongoose\.model|new\s+Schema)/)) {
          role = 'model';
        } else if (content.match(/(?:module\.exports|export\s+(?:default\s+)?function)\s*.*\(req,\s*res/)) {
          role = 'middleware';
        } else if (content.match(/\.listen\s*\(\s*(?:PORT|port|\d+)/)) {
          role = 'entry';
        }
      }
    }

    classified.push({
      file: file.path,
      role,
      size: file.size || (file.content ? file.content.length : 0)
    });
  }

  return classified;
}

module.exports = { classifyFiles };
