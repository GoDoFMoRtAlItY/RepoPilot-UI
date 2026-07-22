/**
 * Extract API/package dependencies from source code using regex patterns.
 * Supports require(), import, Python import, Go import, Ruby require.
 */

function extractApis(tree, content, filePath, apiPackagesLookup) {
  const fileContent = content || '';
  const lookup = apiPackagesLookup || {};
  const apis = [];
  const seen = new Set();

  // Determine extraction patterns based on file type
  const patterns = getPatterns(filePath);

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;

    while ((match = regex.exec(fileContent)) !== null) {
      const rawPackage = pattern.extract(match);
      if (!rawPackage) continue;

      // Get the base package name (handle scoped packages like @scope/pkg)
      let packageName = rawPackage;
      if (rawPackage.startsWith('@')) {
        // Scoped package: @scope/pkg/sub -> @scope/pkg
        const parts = rawPackage.split('/');
        packageName = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : rawPackage;
      } else {
        // Regular package: pkg/sub -> pkg
        packageName = rawPackage.split('/')[0];
      }

      // Skip relative imports
      if (packageName.startsWith('.') || packageName.startsWith('/')) continue;
      
      // Skip Node.js built-in modules
      const builtins = ['fs', 'path', 'http', 'https', 'url', 'os', 'crypto', 'stream',
        'events', 'util', 'child_process', 'cluster', 'net', 'dns', 'tls', 'zlib',
        'readline', 'querystring', 'string_decoder', 'buffer', 'assert', 'timers',
        'console', 'process', 'vm', 'v8', 'worker_threads', 'perf_hooks',
        'node:fs', 'node:path', 'node:http', 'node:https', 'node:url', 'node:os',
        'node:crypto', 'node:stream', 'node:events', 'node:util'];
      if (builtins.includes(packageName)) continue;

      // Skip Python built-in modules
      const pythonBuiltins = ['os', 'sys', 'json', 'datetime', 'time', 'math',
        'collections', 'functools', 'itertools', 're', 'typing', 'pathlib',
        'logging', 'unittest', 'io', 'abc', 'enum', 'dataclasses', 'copy',
        'hashlib', 'secrets', 'random', 'string', 'textwrap', 'struct'];
      if (filePath.endsWith('.py') && pythonBuiltins.includes(packageName)) continue;

      if (seen.has(packageName + ':' + filePath)) continue;
      seen.add(packageName + ':' + filePath);

      // Look up package info
      const info = lookup[packageName] || null;

      // Compute line number
      const linesBefore = fileContent.substring(0, match.index).split('\n');
      const line = linesBefore.length;

      apis.push({
        name: info ? info.name : packageName,
        package: packageName,
        importFile: filePath,
        importLine: line,
        category: info ? info.category : 'unknown',
        description: info ? info.description : null,
        githubUrl: ''
      });
    }
  }

  return apis;
}

function getPatterns(filePath) {
  if (filePath.endsWith('.py')) {
    return [
      // import flask / from flask import Flask
      { regex: /^import\s+(\w+)/gm, extract: (m) => m[1] },
      { regex: /^from\s+(\w+)\s+import/gm, extract: (m) => m[1] }
    ];
  }
  
  if (filePath.endsWith('.go')) {
    return [
      // "github.com/gin-gonic/gin"
      { regex: /"([^"]+)"/g, extract: (m) => {
        const pkg = m[1];
        if (pkg.includes('.') && pkg.includes('/')) {
          // It's a Go module path, get the last segment as name
          return pkg;
        }
        return null;
      }}
    ];
  }

  if (filePath.endsWith('.rb')) {
    return [
      // require 'sinatra' / gem 'rails'
      { regex: /require\s+['"]([^'"]+)['"]/g, extract: (m) => m[1] },
      { regex: /gem\s+['"]([^'"]+)['"]/g, extract: (m) => m[1] }
    ];
  }

  // Default: JS/TS patterns
  return [
    // const x = require('pkg')
    { regex: /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g, extract: (m) => m[1] },
    // import x from 'pkg'
    { regex: /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/g, extract: (m) => m[1] },
    // import('pkg') - dynamic imports
    { regex: /import\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g, extract: (m) => m[1] }
  ];
}

module.exports = { extractApis };
