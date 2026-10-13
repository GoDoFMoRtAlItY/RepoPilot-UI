/**
 * Parsing and schema validation for Gemma output.
 *
 * Gemma never refers to commits by SHA: the prompt gives it milestone refs
 * ("M1", "M2", ...) and only refs that exist in the evidence pack are accepted.
 * SHAs, dates, authors and changed lines in the final response always come
 * from Git data on the server, never from model text.
 */

const REASON_BASIS = new Set(['commit_message', 'diff', 'code', 'unknown']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);

/** Pull the first JSON object out of a model reply (handles ```json fences and chatter). */
function extractJson(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'empty response' };
  let body = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) return { ok: false, error: 'no JSON object found' };
  body = body.slice(start, end + 1);
  try {
    return { ok: true, value: JSON.parse(body) };
  } catch (_) {
    // One local repair attempt (trailing commas) — never a second model call.
    try {
      return { ok: true, value: JSON.parse(body.replace(/,\s*([}\]])/g, '$1')) };
    } catch (err) {
      return { ok: false, error: `invalid JSON: ${err.message}` };
    }
  }
}

function clip(value, max) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

/** Replace hex tokens that look like commit SHAs but are not in the evidence. */
function scrubUnknownShas(text, knownShas) {
  if (!text) return text;
  return text.replace(/\b[0-9a-f]{7,40}\b/gi, token => {
    const t = token.toLowerCase();
    // Only treat tokens containing at least one digit and one letter as SHA-like.
    if (!/[0-9]/.test(t) || !/[a-f]/.test(t)) return token;
    return knownShas.some(sha => sha.startsWith(t)) ? token : '[unverified commit]';
  });
}

function makeTextCleaner(knownShas) {
  return (value, max) => scrubUnknownShas(clip(value, max), knownShas);
}

/**
 * Validate a file-story object.
 * @param {any} raw parsed JSON from Gemma
 * @param {Map<string,string>} refToSha milestone ref -> full SHA (the only refs allowed)
 */
function validateFileStory(raw, refToSha) {
  const issues = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, value: null, issues: ['response is not a JSON object'] };
  }
  const knownShas = [...refToSha.values()].map(s => s.toLowerCase());
  const text = makeTextCleaner(knownShas);

  const chapters = [];
  const seenRefs = new Set();
  if (!Array.isArray(raw.chapters)) issues.push('chapters missing or not an array');
  for (const ch of Array.isArray(raw.chapters) ? raw.chapters : []) {
    const ref = typeof ch?.milestoneRef === 'string' ? ch.milestoneRef.trim().toUpperCase() : null;
    if (!ref || !refToSha.has(ref)) {
      issues.push(`dropped chapter with unknown milestoneRef "${ch?.milestoneRef}"`);
      continue;
    }
    if (seenRefs.has(ref)) {
      issues.push(`dropped duplicate chapter for ${ref}`);
      continue;
    }
    const title = text(ch.title, 90);
    const explanation = text(ch.explanation, 900);
    if (!title || !explanation) {
      issues.push(`dropped chapter ${ref}: missing title or explanation`);
      continue;
    }
    seenRefs.add(ref);
    let reasonBasis = REASON_BASIS.has(ch.reasonBasis) ? ch.reasonBasis : 'unknown';
    let reasonForChange = text(ch.reasonForChange, 500);
    if (!reasonForChange) reasonBasis = 'unknown';
    chapters.push({
      milestoneRef: ref,
      title,
      explanation,
      reasonForChange,
      reasonBasis,
      impact: text(ch.impact, 500),
      confidence: CONFIDENCE.has(ch.confidence) ? ch.confidence : 'low',
    });
  }

  const lingering = [];
  for (const item of Array.isArray(raw?.currentState?.lingeringInfluences) ? raw.currentState.lingeringInfluences : []) {
    const ref = typeof item?.milestoneRef === 'string' ? item.milestoneRef.trim().toUpperCase() : null;
    const note = text(item?.note, 300);
    if (ref && refToSha.has(ref) && note) lingering.push({ milestoneRef: ref, note });
    else issues.push('dropped lingering influence with unknown ref or empty note');
  }

  const value = {
    summary: text(raw.summary, 700),
    origin: {
      explanation: text(raw?.origin?.explanation, 700),
      basis: REASON_BASIS.has(raw?.origin?.basis) ? raw.origin.basis : 'unknown',
    },
    chapters,
    architecturalEvolution: text(raw.architecturalEvolution, 1200),
    currentState: {
      explanation: text(raw?.currentState?.explanation, 900),
      lingeringInfluences: lingering.slice(0, 6),
    },
    uncertainties: (Array.isArray(raw.uncertainties) ? raw.uncertainties : [])
      .map(u => text(u, 300))
      .filter(Boolean)
      .slice(0, 6),
  };

  const ok = chapters.length > 0 || Boolean(value.summary);
  if (!ok) issues.push('no usable chapters or summary');
  return { ok, value, issues };
}

/**
 * Validate a repository-evolution object.
 * @param {Map<string,string>} refToSha
 */
function validateRepoEvolution(raw, refToSha) {
  const issues = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, value: null, issues: ['response is not a JSON object'] };
  }
  const knownShas = [...refToSha.values()].map(s => s.toLowerCase());
  const text = makeTextCleaner(knownShas);
  const milestones = [];
  const seen = new Set();
  for (const m of Array.isArray(raw.milestones) ? raw.milestones : []) {
    const ref = typeof m?.milestoneRef === 'string' ? m.milestoneRef.trim().toUpperCase() : null;
    if (!ref || !refToSha.has(ref) || seen.has(ref)) {
      issues.push(`dropped milestone with invalid ref "${m?.milestoneRef}"`);
      continue;
    }
    const title = text(m.title, 90);
    const explanation = text(m.explanation, 800);
    if (!title || !explanation) {
      issues.push(`dropped milestone ${ref}: missing title or explanation`);
      continue;
    }
    seen.add(ref);
    milestones.push({
      milestoneRef: ref,
      title,
      explanation,
      impact: text(m.impact, 400),
      confidence: CONFIDENCE.has(m.confidence) ? m.confidence : 'low',
    });
  }
  const value = {
    overview: text(raw.overview, 900),
    milestones,
    uncertainties: (Array.isArray(raw.uncertainties) ? raw.uncertainties : []).map(u => text(u, 300)).filter(Boolean).slice(0, 5),
  };
  const ok = milestones.length > 0 || Boolean(value.overview);
  if (!ok) issues.push('no usable milestones or overview');
  return { ok, value, issues };
}

module.exports = {
  extractJson,
  clip,
  scrubUnknownShas,
  validateFileStory,
  validateRepoEvolution,
};
