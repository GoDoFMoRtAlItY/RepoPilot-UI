/**
 * Configuration Security Scanner
 * Checks for usage of security-related middleware and libraries.
 */

function scanConfig(packageJson, filesWithContent) {
  const configStatus = [];
  
  const deps = packageJson ? { ...packageJson.dependencies, ...packageJson.devDependencies } : {};
  const hasDep = (name) => !!deps[name];

  const contentStr = filesWithContent.map(f => f.content).join('\n').toLowerCase();

  const checks = [
    { name: 'Helmet', package: 'helmet', textCheck: 'helmet()' },
    { name: 'CORS', package: 'cors', textCheck: 'cors(' },
    { name: 'Rate Limiting', package: 'express-rate-limit', textCheck: 'ratelimit(' },
    { name: 'HTTPS', package: 'https', textCheck: 'https.createserver' },
    { name: 'Secure Cookies', textCheck: 'secure: true' }, // Basic heuristic
    { name: 'JWT Expiration', textCheck: 'expiresin' }, // Basic heuristic
    { name: 'Input Validation', package: 'joi', altPackage: 'zod', textCheck: 'validator' },
    { name: 'CSRF Protection', package: 'csurf', altPackage: 'csrf', textCheck: 'csrf' },
    { name: 'XSS Protection', package: 'xss', textCheck: 'xss-clean' },
    { name: 'Content Security Policy', textCheck: 'content-security-policy' },
    { name: 'bcrypt / argon2', package: 'bcrypt', altPackage: 'argon2', textCheck: 'bcrypt' },
    { name: 'Environment Validation', package: 'dotenv-safe', altPackage: 'envalid', textCheck: 'zod' }
  ];

  checks.forEach(check => {
    const isConfigured = 
      (check.package && hasDep(check.package)) || 
      (check.altPackage && hasDep(check.altPackage)) || 
      (check.textCheck && contentStr.includes(check.textCheck));

    configStatus.push({
      feature: check.name,
      status: isConfigured ? 'Configured' : 'Missing'
    });
  });

  return configStatus;
}

module.exports = { scanConfig };
