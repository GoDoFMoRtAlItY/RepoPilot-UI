/**
 * Secret Scanner
 * Deterministic Regex-based scanner for exposed secrets in codebase.
 */

const SECRET_PATTERNS = [
  { type: 'GitHub Token', regex: /(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36}/ },
  { type: 'GitLab Token', regex: /glpat-[A-Za-z0-9_\-]{20}/ },
  { type: 'OpenAI Key', regex: /sk-[A-Za-z0-9]{48}/ },
  { type: 'Gemini Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { type: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { type: 'AWS Secret Key', regex: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/ }, // Less accurate, maybe just match aws_secret_access_key?
  { type: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/ },
  { type: 'Bearer Token', regex: /Bearer\s+[A-Za-z0-9\-\._~+\/]+=*/ },
  { type: 'Private RSA Key', regex: /-----BEGIN RSA PRIVATE KEY-----/ },
  { type: 'SSH Key', regex: /-----BEGIN OPENSSH PRIVATE KEY-----/ },
  { type: 'MongoDB URI', regex: /mongodb(?:\+srv)?:\/\/[^\s]+/ },
  { type: 'Postgres/DB URL', regex: /(postgres|mysql|redis):\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+@[a-zA-Z0-9_.-]+/ },
  { type: 'Stripe Key', regex: /(sk_live|rk_live)_[0-9a-zA-Z]{24}/ },
  { type: 'Slack Token', regex: /xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/ },
  { type: 'Twilio Key', regex: /SK[0-9a-fA-F]{32}/ },
  { type: 'Password Pattern', regex: /(password|passwd|pwd)\s*=\s*['"][^'"]+['"]/i },
  { type: 'JWT Secret', regex: /jwt_secret\s*=\s*['"][^'"]+['"]/i },
];

function scanSecrets(filesWithContent) {
  const secretsFound = [];

  for (const file of filesWithContent) {
    if (!file.content || file.content.trim() === '') continue;

    // Skip obviously safe files
    if (file.path.endsWith('package-lock.json') || file.path.endsWith('.svg')) continue;

    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Avoid super long minified lines
      if (line.length > 500) return;

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(line)) {
          
          // Basic false-positive filtering
          if (line.toLowerCase().includes('example') || line.toLowerCase().includes('test')) {
            continue;
          }

          secretsFound.push({
            severity: 'critical',
            type: 'Exposed Secret',
            message: `Possible ${pattern.type} exposed in code.`,
            file: file.path,
            line: index + 1,
            matchedPattern: pattern.type,
            recommendation: `Revoke this ${pattern.type} immediately and use an environment variable instead.`
          });
        }
      }
    });
  }

  return secretsFound;
}

module.exports = { scanSecrets };
