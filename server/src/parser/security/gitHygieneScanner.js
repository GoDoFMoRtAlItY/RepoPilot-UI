/**
 * Git Hygiene Scanner
 * Checks repository quality and committed sensitive files.
 */

function scanGitHygiene(filesWithContent) {
  const hygieneAlerts = [];
  const paths = filesWithContent.map(f => f.path.toLowerCase());

  // Check for committed sensitive files
  const sensitiveFiles = [
    { pattern: '.env', type: '.env committed', severity: 'critical', desc: 'Environment files contain secrets and should never be committed.' },
    { pattern: 'node_modules', type: 'node_modules committed', severity: 'low', desc: 'Dependencies should not be committed.' },
    { pattern: 'dist/', type: 'dist committed', severity: 'informational', desc: 'Build artifacts should not be committed.' },
    { pattern: 'build/', type: 'build committed', severity: 'informational', desc: 'Build artifacts should not be committed.' },
    { pattern: 'coverage/', type: 'coverage committed', severity: 'informational', desc: 'Test coverage reports should not be committed.' },
    { pattern: '.pem', type: 'private keys committed', severity: 'critical', desc: 'Private keys should never be committed.' },
    { pattern: '.key', type: 'private keys committed', severity: 'critical', desc: 'Private keys should never be committed.' },
    { pattern: '.sqlite', type: 'database committed', severity: 'medium', desc: 'Database files should typically not be committed.' }
  ];

  paths.forEach(filePath => {
    sensitiveFiles.forEach(sensitive => {
      if (filePath.includes(sensitive.pattern) && !filePath.includes('.example') && !filePath.includes('.sample') && !filePath.includes('.template')) {
        hygieneAlerts.push({
          severity: sensitive.severity,
          type: 'Git Hygiene',
          message: sensitive.desc,
          file: filePath,
          matchedPattern: sensitive.type,
          recommendation: `Remove ${sensitive.pattern} from the repository and add it to .gitignore.`
        });
      }
    });
  });

  // Check for missing base files
  const missingFiles = [];
  if (!paths.some(p => p.includes('.gitignore'))) missingFiles.push({ file: '.gitignore', required: true });
  if (!paths.some(p => p.includes('readme.md'))) missingFiles.push({ file: 'README.md', required: true });
  if (!paths.some(p => p.includes('license'))) missingFiles.push({ file: 'LICENSE', required: false });
  if (!paths.some(p => p.includes('security.md'))) missingFiles.push({ file: 'SECURITY.md', required: false });

  return { hygieneAlerts, missingFiles };
}

module.exports = { scanGitHygiene };
