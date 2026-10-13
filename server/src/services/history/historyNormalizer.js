/**
 * Deterministic helpers for the Time Machine.
 *
 * Everything here is pure (no network, no AI). Git establishes WHAT changed and
 * WHEN; these functions turn raw GitHub commit/patch data into structured facts
 * that the UI can show directly and that Gemma can explain.
 */

const MAX_PATCH_LINES_PER_MILESTONE = 80;

// ---------------------------------------------------------------------------
// Commit normalisation
// ---------------------------------------------------------------------------

/** Normalise an item from GET /repos/{owner}/{repo}/commits */
function normalizeListCommit(item, path) {
  const message = item?.commit?.message || '';
  return {
    sha: item.sha,
    shortSha: (item.sha || '').slice(0, 7),
    title: message.split('\n')[0].slice(0, 200),
    message: message.slice(0, 2000),
    authorName: item?.commit?.author?.name || item?.author?.login || 'unknown',
    authorLogin: item?.author?.login || null,
    date: item?.commit?.author?.date || item?.commit?.committer?.date || null,
    htmlUrl: item.html_url || null,
    parents: (item.parents || []).map(p => p.sha),
    path, // the file path this commit was found under (differs before a rename)
  };
}

/** Normalise GET /repos/{owner}/{repo}/commits/{sha} */
function normalizeCommitDetail(data) {
  const files = (data.files || []).map(f => ({
    filename: f.filename,
    previousFilename: f.previous_filename || null,
    status: f.status, // added | modified | removed | renamed | copied | changed | unchanged
    additions: f.additions || 0,
    deletions: f.deletions || 0,
    changes: f.changes || 0,
    patch: typeof f.patch === 'string' ? f.patch : null,
  }));
  return {
    sha: data.sha,
    parents: (data.parents || []).map(p => p.sha),
    stats: data.stats || { additions: 0, deletions: 0, total: 0 },
    files,
    // GitHub returns at most 300 files per page for a commit.
    filesTruncated: files.length >= 300,
    message: data?.commit?.message || '',
    date: data?.commit?.author?.date || null,
    authorName: data?.commit?.author?.name || data?.author?.login || 'unknown',
    htmlUrl: data.html_url || null,
  };
}

/** Find the entry for `path` (or the file it was renamed to) inside a commit detail. */
function findFileChange(detail, path) {
  if (!detail || !Array.isArray(detail.files)) return null;
  return detail.files.find(f => f.filename === path) ||
    detail.files.find(f => f.previousFilename === path) ||
    null;
}

// ---------------------------------------------------------------------------
// Patch parsing & structural change extraction
// ---------------------------------------------------------------------------

function splitPatch(patch) {
  const added = [];
  const removed = [];
  if (!patch) return { added, removed };
  for (const line of patch.split('\n')) {
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+')) added.push(line.slice(1));
    else if (line.startsWith('-')) removed.push(line.slice(1));
  }
  return { added, removed };
}

const IMPORT_PATTERNS = [
  /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/,          // ES import
  /require\(\s*['"]([^'"]+)['"]\s*\)/,                                // CommonJS
  /^\s*from\s+([\w.]+)\s+import\s+/,                                  // Python from-import
  /^\s*import\s+([\w.]+)\s*$/,                                        // Python import
];

const SYMBOL_PATTERNS = [
  /^\s*export\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
  /^\s*(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/,
  /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/,
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/,
  /^\s*(?:export\s+)?(?:interface|type|enum)\s+([A-Za-z_$][\w$]*)/,
  /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/,                       // Python
];

const EXPORT_PATTERNS = [
  /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function\s*\*?|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/,
  /^\s*module\.exports\.([A-Za-z_$][\w$]*)\s*=/,
  /^\s*exports\.([A-Za-z_$][\w$]*)\s*=/,
];

const ROUTE_PATTERN = /\b(?:app|router|server|api)\.(get|post|put|patch|delete|all|use)\(\s*['"`]([^'"`]+)['"`]/i;

function collect(lines, patterns) {
  const out = new Set();
  for (const line of lines) {
    for (const re of patterns) {
      const m = line.match(re);
      if (m && m[1]) { out.add(m[1]); break; }
    }
  }
  return out;
}

function collectRoutes(lines) {
  const out = new Set();
  for (const line of lines) {
    const m = line.match(ROUTE_PATTERN);
    if (m) out.add(`${m[1].toUpperCase()} ${m[2]}`);
  }
  return out;
}

function setDiff(a, b) {
  return [...a].filter(x => !b.has(x));
}

/**
 * Extract structural changes from a unified diff. A name that appears on both
 * a removed and an added line is treated as "modified", not added/removed.
 */
function extractStructuralChanges(patch) {
  const { added, removed } = splitPatch(patch);
  const addImp = collect(added, IMPORT_PATTERNS);
  const remImp = collect(removed, IMPORT_PATTERNS);
  const addSym = collect(added, SYMBOL_PATTERNS);
  const remSym = collect(removed, SYMBOL_PATTERNS);
  const addExp = collect(added, EXPORT_PATTERNS);
  const remExp = collect(removed, EXPORT_PATTERNS);
  const addRoutes = collectRoutes(added);
  const remRoutes = collectRoutes(removed);

  const modifiedSymbols = [...addSym].filter(s => remSym.has(s));

  return {
    addedImports: setDiff(addImp, remImp),
    removedImports: setDiff(remImp, addImp),
    addedSymbols: setDiff(addSym, remSym),
    removedSymbols: setDiff(remSym, addSym),
    modifiedSymbols,
    addedExports: setDiff(addExp, remExp),
    removedExports: setDiff(remExp, addExp),
    addedRoutes: setDiff(addRoutes, remRoutes),
    removedRoutes: setDiff(remRoutes, addRoutes),
    linesAdded: added.length,
    linesRemoved: removed.length,
  };
}

function structuralWeight(s) {
  if (!s) return 0;
  return (
    s.addedImports.length + s.removedImports.length +
    2 * (s.addedSymbols.length + s.removedSymbols.length) +
    s.modifiedSymbols.length +
    2 * (s.addedExports.length + s.removedExports.length) +
    3 * (s.addedRoutes.length + s.removedRoutes.length)
  );
}

/** Keep the first `maxLines` lines of a patch so prompts and payloads stay bounded. */
function trimPatch(patch, maxLines = MAX_PATCH_LINES_PER_MILESTONE) {
  if (!patch) return { excerpt: null, truncated: false, available: false, totalLines: 0 };
  const lines = patch.split('\n');
  return {
    excerpt: lines.slice(0, maxLines).join('\n'),
    truncated: lines.length > maxLines,
    available: true,
    totalLines: lines.length,
  };
}

// ---------------------------------------------------------------------------
// Generated / vendored files (ignored when ranking repository-level changes)
// ---------------------------------------------------------------------------

const NOISE_PATTERNS = [
  /(^|\/)(node_modules|vendor|bower_components|dist|build|coverage|\.next|\.nuxt|out|target|__pycache__)\//,
  /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|poetry\.lock|Pipfile\.lock|composer\.lock|Gemfile\.lock|go\.sum)$/,
  /\.min\.(js|css)$/,
  /\.map$/,
];

function isNoisePath(p) {
  return NOISE_PATTERNS.some(re => re.test(p || ''));
}

// ---------------------------------------------------------------------------
// Classification & milestone selection
// ---------------------------------------------------------------------------

const KIND_RULES = [
  { kind: 'security', re: /\b(security|vulnerab\w*|cve-\d+|xss|csrf|sanitiz\w*|injection|secret|helmet|rate[- ]?limit\w*)\b/i },
  { kind: 'refactor', re: /\b(refactor\w*|restructur\w*|extract\w*|split|reorgani[sz]\w*|clean ?up|rewrite|rewrote|migrat\w*|move[sd]?)\b/i },
  { kind: 'feature', re: /^(feat|feature)(\(.+\))?!?:|\b(add(s|ed)?|implement\w*|introduc\w*|support\w*|new|enable\w*|create[sd]?)\b/i },
  { kind: 'fix', re: /^fix(\(.+\))?!?:|\b(fix(es|ed)?|bug|hotfix|patch(es|ed)?|resolve[sd]?|repair\w*)\b/i },
  { kind: 'maintenance', re: /^(chore|docs?|style|test|ci|build)(\(.+\))?!?:|\b(bump|typo|format\w*|lint\w*|readme|comment\w*)\b/i },
];

const SIGNIFICANT_MESSAGE = /\b(feat|refactor|rewrite|migrat|introduc|implement|security|breaking|redesign|architecture|extract|split|replace|remove|deprecat|initial)\b/i;

// Conventional-commit prefixes are an explicit statement by the author, so they win over keywords.
const CONVENTIONAL = /^(\w+)(\([^)]*\))?!?:/;
const CONVENTIONAL_KIND = {
  feat: 'feature', feature: 'feature',
  fix: 'fix', bugfix: 'fix', hotfix: 'fix',
  refactor: 'refactor', perf: 'refactor',
  security: 'security', sec: 'security',
  chore: 'maintenance', docs: 'maintenance', doc: 'maintenance', style: 'maintenance',
  test: 'maintenance', tests: 'maintenance', ci: 'maintenance', build: 'maintenance',
};

function isRevert(title) {
  return /^Revert "/.test(title || '');
}

function classifyCommit(message, fileChange) {
  if (fileChange?.status === 'added') return 'origin';
  if (fileChange?.status === 'renamed') return 'rename';
  if (fileChange?.status === 'removed') return 'removal';
  const title = (message || '').split('\n')[0];
  if (isRevert(title)) return 'revert';
  const conv = title.match(CONVENTIONAL);
  if (conv && CONVENTIONAL_KIND[conv[1].toLowerCase()]) return CONVENTIONAL_KIND[conv[1].toLowerCase()];
  for (const rule of KIND_RULES) {
    if (rule.re.test(title)) return rule.kind;
  }
  return 'update';
}

const KIND_WEIGHT = { origin: 100, rename: 60, removal: 60, security: 25, refactor: 20, feature: 15, fix: 8, update: 4, revert: 2, maintenance: 0 };

/**
 * Score a commit that has full detail. Higher = more story-worthy.
 * churn is log-scaled so one giant reformat does not dominate everything.
 */
function scoreEntry(entry) {
  const churn = (entry.stats?.additions || 0) + (entry.stats?.deletions || 0);
  return (
    (KIND_WEIGHT[entry.kind] ?? 4) +
    Math.log2(1 + churn) * 4 +
    structuralWeight(entry.structural) * 3
  );
}

function isTrivial(entry) {
  const churn = (entry.stats?.additions || 0) + (entry.stats?.deletions || 0);
  return entry.kind === 'maintenance' && churn <= 4 && structuralWeight(entry.structural) === 0;
}

/**
 * Choose which commits get full detail fetched. commits are newest -> oldest.
 * Always keeps: newest, oldest, commits at rename boundaries, then commits with
 * significant-looking messages, then evenly spaced samples.
 */
function pickCommitsForDetail(commits, max = 20, renameShas = new Set()) {
  if (commits.length <= max) return commits.map(c => c.sha);
  const chosen = new Set();
  const add = sha => { if (chosen.size < max) chosen.add(sha); };
  add(commits[0].sha);
  add(commits[commits.length - 1].sha);
  for (const c of commits) if (renameShas.has(c.sha)) add(c.sha);
  for (const c of commits) if (SIGNIFICANT_MESSAGE.test(c.title)) add(c.sha);
  const remaining = max - chosen.size;
  if (remaining > 0) {
    const step = commits.length / (remaining + 1);
    for (let i = 1; i <= remaining; i++) add(commits[Math.floor(i * step)].sha);
  }
  // Evenly spaced samples can collide with already chosen commits; top up in order.
  for (let i = 0; i < commits.length && chosen.size < max; i++) add(commits[i].sha);
  return [...chosen];
}

/**
 * Pick milestone entries (chronological, oldest first) from detailed entries.
 * The origin and the most recent change are always included; renames are always
 * included; the rest are ranked by score, skipping trivial commits.
 */
function selectMilestones(detailedEntriesOldestFirst, max = 8) {
  const entries = detailedEntriesOldestFirst;
  if (entries.length === 0) return [];
  const must = new Set([entries[0].sha, entries[entries.length - 1].sha]);
  for (const e of entries) if (e.kind === 'rename' || e.kind === 'removal') must.add(e.sha);

  const ranked = entries
    .filter(e => !must.has(e.sha) && !isTrivial(e))
    .sort((a, b) => scoreEntry(b) - scoreEntry(a));

  const selected = new Set(must);
  for (const e of ranked) {
    if (selected.size >= max) break;
    selected.add(e.sha);
  }
  return entries.filter(e => selected.has(e.sha));
}

// ---------------------------------------------------------------------------
// Deterministic narrative (used when Gemma is unavailable or returns bad output)
// ---------------------------------------------------------------------------

function listText(items, max = 4) {
  if (!items || items.length === 0) return '';
  const shown = items.slice(0, max).map(x => `${x}`).join(', ');
  return items.length > max ? `${shown} and ${items.length - max} more` : shown;
}

function deterministicTitle(entry) {
  const s = entry.structural;
  switch (entry.kind) {
    case 'origin': return 'File created';
    case 'rename': return `Moved from ${entry.renamedFrom || 'a previous path'}`;
    case 'removal': return 'File removed';
    default:
      if (s?.addedRoutes?.length) return `Routes added: ${s.addedRoutes.slice(0, 2).join(', ')}`;
      if (s?.addedSymbols?.length) return `Added ${s.addedSymbols.slice(0, 2).join(', ')}`;
      if (s?.removedSymbols?.length) return `Removed ${s.removedSymbols.slice(0, 2).join(', ')}`;
      return entry.title ? entry.title.slice(0, 80) : 'Updated';
  }
}

function deterministicExplanation(entry) {
  const s = entry.structural || {};
  const parts = [];
  parts.push(`Commit message: "${(entry.title || '').slice(0, 160)}".`);
  if (entry.stats) parts.push(`+${entry.stats.additions} / -${entry.stats.deletions} lines in this file.`);
  if (s.addedSymbols?.length) parts.push(`Added ${listText(s.addedSymbols)}.`);
  if (s.removedSymbols?.length) parts.push(`Removed ${listText(s.removedSymbols)}.`);
  if (s.modifiedSymbols?.length) parts.push(`Changed ${listText(s.modifiedSymbols)}.`);
  if (s.addedImports?.length) parts.push(`New dependencies: ${listText(s.addedImports)}.`);
  if (s.removedImports?.length) parts.push(`Dropped dependencies: ${listText(s.removedImports)}.`);
  if (s.addedRoutes?.length) parts.push(`New routes: ${listText(s.addedRoutes)}.`);
  if (entry.kind === 'rename' && entry.renamedFrom) parts.push(`Previously located at ${entry.renamedFrom}.`);
  return parts.join(' ');
}

module.exports = {
  MAX_PATCH_LINES_PER_MILESTONE,
  normalizeListCommit,
  normalizeCommitDetail,
  findFileChange,
  splitPatch,
  extractStructuralChanges,
  structuralWeight,
  trimPatch,
  classifyCommit,
  isRevert,
  isNoisePath,
  scoreEntry,
  isTrivial,
  pickCommitsForDetail,
  selectMilestones,
  deterministicTitle,
  deterministicExplanation,
};
