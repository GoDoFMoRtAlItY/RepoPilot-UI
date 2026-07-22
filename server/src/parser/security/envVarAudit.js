/**
 * Environment Variable Audit Scanner
 * Compares .env.example with actual code usage.
 */

function auditEnvVars(filesWithContent, extractedEnvVars) {
  const envAudit = [];
  
  // Find .env.example
  const exampleFile = filesWithContent.find(f => f.path.toLowerCase().endsWith('.env.example') || f.path.toLowerCase().endsWith('.env.sample'));
  
  const documentedVars = new Set();
  if (exampleFile) {
    const lines = exampleFile.content.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([A-Z0-9_]+)=/);
      if (match) {
        documentedVars.add(match[1]);
      }
    });
  }

  const usedVars = new Set(extractedEnvVars.map(e => e.name));

  // Check Documented but Unused
  documentedVars.forEach(v => {
    if (!usedVars.has(v)) {
      envAudit.push({
        variable: v,
        status: 'Unused',
        desc: 'Documented in .env.example but not found in code.'
      });
    }
  });

  // Check Used but Undocumented
  usedVars.forEach(v => {
    if (exampleFile && !documentedVars.has(v)) {
      envAudit.push({
        variable: v,
        status: 'Missing',
        desc: 'Used in code but missing from .env.example.'
      });
    } else if (!exampleFile) {
        envAudit.push({
            variable: v,
            status: 'Required',
            desc: 'Used in code.'
        });
    }
  });
  
  // Check used variables that might have hardcoded defaults that are sensitive
  extractedEnvVars.forEach(v => {
      if (v.defaultValue && v.defaultValue.length > 5 && !v.defaultValue.includes('http') && v.name.toLowerCase().includes('secret')) {
        envAudit.push({
            variable: v.name,
            status: 'Hardcoded Default',
            desc: `Has a suspicious hardcoded default: ${v.defaultValue}`
        });
      }
  });

  // Add all documented vars that are also used as Required or Optional (mocking optional based on default value)
  documentedVars.forEach(v => {
    if (usedVars.has(v)) {
        const usageInfo = extractedEnvVars.find(e => e.name === v);
        const status = usageInfo?.defaultValue ? 'Optional' : 'Required';
        envAudit.push({
            variable: v,
            status,
            desc: usageInfo?.defaultValue ? `Has fallback default in code.` : `Must be provided in environment.`
        });
    }
  });

  // Deduplicate and return
  const uniqueAudit = [];
  const seen = new Set();
  for (const item of envAudit) {
      if (!seen.has(item.variable)) {
          seen.add(item.variable);
          uniqueAudit.push(item);
      }
  }

  return uniqueAudit;
}

module.exports = { auditEnvVars };
