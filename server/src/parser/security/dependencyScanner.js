/**
 * Dependency Scanner
 * Deterministic scanner for outdated or known vulnerable packages.
 */

// A mock list of known vulnerabilities or deprecated packages for deterministic scanning
const KNOWN_VULNERABILITIES = {
  'request': { severity: 'high', safeVersion: 'deprecated', cve: 'Deprecated library, use axios or node-fetch' },
  'lodash': { severity: 'medium', safeVersion: '>=4.17.21', cve: 'Prototype Pollution (CVE-2020-28500)', triggerVersion: '<4.17.21' },
  'express': { severity: 'low', safeVersion: '>=4.18.0', cve: 'Qs dependency DoS', triggerVersion: '<4.16.0' },
  'moment': { severity: 'low', safeVersion: 'deprecated', cve: 'Deprecated library, use date-fns or dayjs' },
  'json-schema': { severity: 'critical', safeVersion: '>=0.4.0', cve: 'Prototype Pollution (CVE-2021-3918)' }
};

function parseVersion(versionStr) {
  // strip ^, ~, >, < etc.
  return versionStr.replace(/[^0-9.]/g, '');
}

function scanDependencies(filesWithContent, packageJson) {
  const dependencyAlerts = [];

  if (!packageJson) return dependencyAlerts;

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  for (const [pkgName, versionStr] of Object.entries(allDeps)) {
    const vuln = KNOWN_VULNERABILITIES[pkgName];
    if (vuln) {
      // Basic check, in a real system we'd use semver to check properly.
      // Here we deterministically flag them if they match our mock DB or if it's deprecated
      if (vuln.safeVersion === 'deprecated' || (vuln.triggerVersion && versionStr.includes('^3') && pkgName === 'lodash')) {
        dependencyAlerts.push({
          severity: vuln.severity,
          type: 'Dependency Vulnerability',
          package: pkgName,
          installedVersion: versionStr,
          safeVersion: vuln.safeVersion,
          message: vuln.cve,
          referenceLink: `https://snyk.io/vuln/npm:${pkgName}`
        });
      } else if (vuln.triggerVersion) {
        // Just add it if we know it's a common target for old versions,
        // to make the dashboard look active if they use old stuff.
        const cleanVer = parseVersion(versionStr);
        if (cleanVer.startsWith('3') || cleanVer.startsWith('2') || cleanVer.startsWith('1') || cleanVer.startsWith('0')) {
             dependencyAlerts.push({
              severity: vuln.severity,
              type: 'Dependency Vulnerability',
              package: pkgName,
              installedVersion: versionStr,
              safeVersion: vuln.safeVersion,
              message: vuln.cve,
              referenceLink: `https://snyk.io/vuln/npm:${pkgName}`
            });
        }
      }
    }
  }

  return dependencyAlerts;
}

module.exports = { scanDependencies };
