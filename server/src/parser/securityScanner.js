const { scanSecrets } = require('./security/secretScanner');
const { scanDependencies } = require('./security/dependencyScanner');
const { scanGitHygiene } = require('./security/gitHygieneScanner');
const { scanConfig } = require('./security/configScanner');
const { scanStaticCode } = require('./security/staticAnalysisScanner');
const { auditEnvVars } = require('./security/envVarAudit');
const { scanBestPractices } = require('./security/bestPracticesScanner');

function calculateSecurityScore(alerts, hygiene, missingFiles, configStatus, bestPractices) {
  let critical = 0, high = 0, medium = 0, low = 0;
  
  alerts.forEach(a => {
    if (a.severity === 'critical') critical++;
    else if (a.severity === 'high') high++;
    else if (a.severity === 'medium') medium++;
    else if (a.severity === 'low') low++;
  });

  const vulnPenalty =
    15 * Math.sqrt(critical) +
    7 * Math.sqrt(high) +
    3 * Math.sqrt(medium) +
    1 * Math.sqrt(low);

  let missingConfigCount = configStatus.filter(c => c.status === 'Missing').length;
  let missingPracticesCount = bestPractices.filter(b => b.status === 'Missing').length;
  let missingFilesCount = missingFiles.length;

  const configPenalty = Math.min(missingConfigCount * 2, 16);
  const hygienePenalty = Math.min(missingPracticesCount * 2, 10);
  const filePenalty = Math.min(missingFilesCount * 3, 9);

  let score = 100 - vulnPenalty - configPenalty - hygienePenalty - filePenalty;
  
  return Math.max(0, Math.min(100, Math.round(score)));
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
