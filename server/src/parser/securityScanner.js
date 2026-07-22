const { scanSecrets } = require('./security/secretScanner');
const { scanDependencies } = require('./security/dependencyScanner');
const { scanGitHygiene } = require('./security/gitHygieneScanner');
const { scanConfig } = require('./security/configScanner');
const { scanStaticCode } = require('./security/staticAnalysisScanner');
const { auditEnvVars } = require('./security/envVarAudit');
const { scanBestPractices } = require('./security/bestPracticesScanner');

function calculateSecurityScore(alerts, hygiene, missingFiles, configStatus, bestPractices) {
  let score = 100;

  // Deduct for alerts
  alerts.forEach(a => {
    if (a.severity === 'critical') score -= 15;
    else if (a.severity === 'high') score -= 10;
    else if (a.severity === 'medium') score -= 5;
    else if (a.severity === 'low') score -= 2;
  });

  // Deduct for missing base files
  missingFiles.forEach(m => {
    if (m.required) score -= 5;
    else score -= 2;
  });

  // Deduct for missing config
  configStatus.forEach(c => {
    if (c.status === 'Missing') score -= 2;
  });

  // Deduct for missing best practices
  bestPractices.forEach(b => {
    if (b.status === 'Missing') score -= 2;
  });

  // Add points for good things (max 100)
  // Just bounded to 0-100
  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(alerts, hygiene, missingFiles, configStatus, bestPractices, envAudit) {
  const recommendations = [];

  // Alerts
  if (alerts.some(a => a.severity === 'critical')) recommendations.push("Address critical vulnerabilities immediately.");
  if (alerts.some(a => a.type === 'Exposed Secret')) recommendations.push("Rotate exposed API keys and secrets immediately.");

  // Config
  if (configStatus.find(c => c.feature === 'Helmet' && c.status === 'Missing')) recommendations.push("Enable Helmet middleware to set secure HTTP headers.");
  if (configStatus.find(c => c.feature === 'Rate Limiting' && c.status === 'Missing')) recommendations.push("Add rate limiting to prevent brute-force attacks.");
  if (configStatus.find(c => c.feature === 'Content Security Policy' && c.status === 'Missing')) recommendations.push("Configure CSP headers to mitigate XSS risks.");
  if (configStatus.find(c => c.feature === 'HTTPS' && c.status === 'Missing')) recommendations.push("Use HTTPS in production.");

  // Git Hygiene
  if (hygiene.some(h => h.matchedPattern === '.env committed')) recommendations.push("Never commit .env files. Remove them from git history.");

  // Best Practices
  if (bestPractices.find(b => b.practice === 'Dependabot' && b.status === 'Missing')) recommendations.push("Enable Dependabot or Renovate for automated dependency updates.");
  if (missingFiles.find(m => m.file === 'SECURITY.md')) recommendations.push("Add SECURITY.md to define your vulnerability reporting process.");

  // Env
  if (envAudit.some(e => e.status === 'Hardcoded Default')) recommendations.push("Avoid hardcoding sensitive defaults for environment variables.");
  if (envAudit.some(e => e.status === 'Missing')) recommendations.push("Ensure all used environment variables are documented in .env.example.");

  // Deduplicate and fallback
  const uniqueRecs = [...new Set(recommendations)];
  if (uniqueRecs.length === 0) {
    uniqueRecs.push("Continue following secure coding practices.");
  }

  return uniqueRecs;
}

function scanSecurityComprehensive(filesWithContent, packageJson, extractedEnvVars) {
  const secretAlerts = scanSecrets(filesWithContent);
  const dependencyAlerts = scanDependencies(filesWithContent, packageJson);
  const { hygieneAlerts, missingFiles } = scanGitHygiene(filesWithContent);
  const configStatus = scanConfig(packageJson, filesWithContent);
  const staticAlerts = scanStaticCode(filesWithContent);
  const envAudit = auditEnvVars(filesWithContent, extractedEnvVars);
  const bestPractices = scanBestPractices(filesWithContent, packageJson);

  // Combine all alerts for severity summary
  const allAlerts = [...secretAlerts, ...dependencyAlerts, ...hygieneAlerts, ...staticAlerts];

  const score = calculateSecurityScore(allAlerts, hygieneAlerts, missingFiles, configStatus, bestPractices);
  const recommendations = generateRecommendations(allAlerts, hygieneAlerts, missingFiles, configStatus, bestPractices, envAudit);

  return {
    securityScore: score,
    securityAlerts: allAlerts,
    dependencySecurity: dependencyAlerts,
    gitHygiene: hygieneAlerts, // Or { alerts, missingFiles } but ui probably just wants a checklist. We'll pass both if needed.
    missingFiles,
    configSecurity: configStatus,
    staticCodeAnalysis: staticAlerts,
    envAudit,
    bestPractices,
    securityRecommendations: recommendations
  };
}

// Keep the old signature for compatibility, but it will only return alerts if called this way
function scanSecurity(filesWithContent, packageJson) {
   const res = scanSecurityComprehensive(filesWithContent, packageJson, []);
   return res.securityAlerts;
}

module.exports = { scanSecurity, scanSecurityComprehensive };
