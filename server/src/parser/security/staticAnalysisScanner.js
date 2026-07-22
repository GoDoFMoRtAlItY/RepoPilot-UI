/**
 * Static Code Analysis Scanner
 * Searches for dangerous patterns.
 */

const DANGEROUS_PATTERNS = [
  { regex: /\beval\s*\(/, type: 'eval() usage', severity: 'critical', desc: 'Executing arbitrary code via eval() can lead to arbitrary code execution.' },
  { regex: /new\s+Function\s*\(/, type: 'new Function() usage', severity: 'critical', desc: 'Creating functions from strings can lead to arbitrary code execution.' },
  { regex: /\bexec\s*\(/, type: 'Command Injection (exec)', severity: 'high', desc: 'Executing shell commands can lead to command injection.' },
  { regex: /\bspawn\s*\(/, type: 'Command Injection (spawn)', severity: 'high', desc: 'Executing shell commands can lead to command injection.' },
  { regex: /child_process/, type: 'child_process import', severity: 'medium', desc: 'Using child_process requires careful input validation.' },
  { regex: /SELECT.*FROM.*WHERE.*\+/, type: 'SQL Concatenation', severity: 'high', desc: 'String concatenation in SQL queries can lead to SQL Injection.' },
  { regex: /find\(\{.*req\.body.*\}/, type: 'NoSQL Injection', severity: 'high', desc: 'Passing raw user input to NoSQL queries can lead to NoSQL Injection.' },
  { regex: /Math\.random\s*\(/, type: 'Weak PRNG', severity: 'low', desc: 'Math.random() is cryptographically weak. Use crypto.randomBytes() instead.' },
  { regex: /createHash\(['"]md5['"]\)/, type: 'Weak Hash (MD5)', severity: 'medium', desc: 'MD5 is vulnerable to collision attacks.' },
  { regex: /createHash\(['"]sha1['"]\)/, type: 'Weak Hash (SHA1)', severity: 'medium', desc: 'SHA1 is vulnerable to collision attacks.' },
  { regex: /req\.body\[/, type: 'Prototype Pollution', severity: 'medium', desc: 'Directly assigning to objects from user input can lead to Prototype Pollution.' },
  { regex: /fs\.readFile\s*\(\s*req\./, type: 'Path Traversal', severity: 'high', desc: 'Passing user input directly to file system operations can lead to Path Traversal.' },
];

function scanStaticCode(filesWithContent) {
  const analysisAlerts = [];

  for (const file of filesWithContent) {
    if (!file.content || file.content.trim() === '') continue;
    
    // Only scan JS/TS files
    if (!file.path.match(/\.(js|ts|jsx|tsx)$/)) continue;

    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      if (line.length > 500) return; // skip minified

      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.regex.test(line)) {
          // False positive filter
          if (line.includes('//') || line.includes('/*') || line.includes('eslint-disable')) return;

          analysisAlerts.push({
            severity: pattern.severity,
            type: pattern.type,
            message: pattern.desc,
            file: file.path,
            line: index + 1,
            codeSnippet: line.trim().substring(0, 100),
            recommendation: `Review the usage of ${pattern.type} and ensure user input is properly sanitized or use a safer alternative.`
          });
        }
      }
    });
  }

  return analysisAlerts;
}

module.exports = { scanStaticCode };
