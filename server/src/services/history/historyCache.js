const { LRUCache } = require('lru-cache');

/**
 * Time Machine caches are kept separate from the shared analysis cache
 * (services/cache.js holds only 50 entries) so history data never evicts a
 * full repository analysis.
 *
 * Bump ANALYSIS_VERSION whenever prompts, schema or selection logic change so
 * old cached stories are not served.
 */
const ANALYSIS_VERSION = 'tm-v1';

const HOUR = 60 * 60 * 1000;

// Commit details are immutable for a given SHA.
const commitDetailCache = new LRUCache({ max: 1000, ttl: 24 * HOUR });
// Path history listings keyed by an immutable ref SHA.
const pathHistoryCache = new LRUCache({ max: 300, ttl: 6 * HOUR });
// Generated file stories keyed by the latest commit that touched the file.
const storyCache = new LRUCache({ max: 200, ttl: 6 * HOUR });
// Repository evolution keyed by branch head SHA.
const evolutionCache = new LRUCache({ max: 50, ttl: 1 * HOUR });

// In-flight request de-duplication: identical concurrent requests share one promise.
const inflight = new Map();

function dedupe(key, factory) {
  if (inflight.has(key)) return inflight.get(key);
  const p = Promise.resolve()
    .then(factory)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Owner/repo are case-insensitive on GitHub; file paths are NOT, so keep path as-is.
function repoId(owner, repo) {
  return `${owner}/${repo}`.toLowerCase();
}

function storyKey(owner, repo, path, latestFileSha) {
  return `${ANALYSIS_VERSION}:story:${repoId(owner, repo)}:${path}@${latestFileSha}`;
}

function evolutionKey(owner, repo, headSha) {
  return `${ANALYSIS_VERSION}:evo:${repoId(owner, repo)}@${headSha}`;
}

module.exports = {
  ANALYSIS_VERSION,
  commitDetailCache,
  pathHistoryCache,
  storyCache,
  evolutionCache,
  inflight,
  dedupe,
  repoId,
  storyKey,
  evolutionKey,
};
