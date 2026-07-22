/**
 * Best Practices Scanner
 * Checks for standard repository best practices.
 */

function scanBestPractices(filesWithContent, packageJson) {
  const practices = [];
  const paths = filesWithContent.map(f => f.path.toLowerCase());
  
  const deps = packageJson ? { ...packageJson.dependencies, ...packageJson.devDependencies } : {};
  const hasDep = (name) => !!deps[name];

  const checks = [
    { name: 'README', check: () => paths.some(p => p.includes('readme.md')) },
    { name: 'SECURITY.md', check: () => paths.some(p => p.includes('security.md')) },
    { name: 'CODE_OF_CONDUCT', check: () => paths.some(p => p.includes('code_of_conduct.md')) },
    { name: 'CONTRIBUTING', check: () => paths.some(p => p.includes('contributing.md')) },
    { name: 'LICENSE', check: () => paths.some(p => p.includes('license')) },
    { name: 'Docker', check: () => paths.some(p => p.includes('dockerfile')) },
    { name: 'Docker Compose', check: () => paths.some(p => p.includes('docker-compose')) },
    { name: 'CI/CD (GitHub Actions)', check: () => paths.some(p => p.includes('.github/workflows')) },
    { name: 'Dependabot', check: () => paths.some(p => p.includes('dependabot.yml')) },
    { name: 'Renovate', check: () => paths.some(p => p.includes('renovate.json')) },
    { name: 'Linting', check: () => paths.some(p => p.includes('.eslintrc') || p.includes('eslint.config')) || hasDep('eslint') },
    { name: 'Tests', check: () => paths.some(p => p.includes('.test.') || p.includes('.spec.') || p.includes('__tests__')) || hasDep('jest') || hasDep('mocha') || hasDep('vitest') },
    { name: 'TypeScript', check: () => paths.some(p => p.endsWith('.ts') || p.endsWith('.tsx')) || hasDep('typescript') },
    { name: 'Prettier', check: () => paths.some(p => p.includes('.prettierrc')) || hasDep('prettier') }
  ];

  checks.forEach(c => {
    practices.push({
      practice: c.name,
      status: c.check() ? 'Passed' : 'Missing'
    });
  });

  return practices;
}

module.exports = { scanBestPractices };
