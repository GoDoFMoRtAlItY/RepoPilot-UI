/**
 * GitHub history retrieval for the Time Machine.
 *
 * All functions take an Octokit-compatible `client` (the shared authenticated
 * instance from services/github.js in production, a stub in tests) and a
 * `counter` object so callers can report exactly how many GitHub API calls a
 * request cost.
 */

const {
  normalizeListCommit,
  normalizeCommitDetail,
  findFileChange,
} = require('./historyNormalizer');
const { commitDetailCache, pathHistoryCache, repoId } = require('./historyCache');

const FULL_SHA = /^[0-9a-f]{40}$/i;
const PER_PAGE = 100;

function createCounter() {
  return { github: 0, githubCached: 0 };
}

/**
 * GET /repos/{owner}/{repo}/commits?path=...&sha=ref, paginated up to `limit`.
 * Returns newest -> oldest. `truncated` is true when more commits exist than
 * were fetched — fetching 100 commits never implies the whole history.
 */
async function listPathCommits(client, { owner, repo, path, ref, limit = 150, counter = createCounter() }) {
  const cacheable = ref && FULL_SHA.test(ref);
  const cacheKey = `${repoId(owner, repo)}:${path}@${ref}:${limit}`;
  if (cacheable && pathHistoryCache.has(cacheKey)) {
    counter.githubCached++;
    return pathHistoryCache.get(cacheKey);
  }

  const commits = [];
  let page = 1;
  let hasMore = false;

  while (commits.length < limit) {
    const params = { owner, repo, per_page: PER_PAGE, page };
    if (path) params.path = path;
    if (ref) params.sha = ref;
    counter.github++;
    const res = await client.rest.repos.listCommits(params);
    const items = Array.isArray(res.data) ? res.data : [];
    commits.push(...items.map(item => normalizeListCommit(item, path)));
    const link = res.headers && res.headers.link;
    hasMore = typeof link === 'string' ? /rel="next"/.test(link) : false;
    if (!hasMore || items.length === 0) break;
    page++;
  }

  const result = {
    commits: commits.slice(0, limit),
    truncated: hasMore || commits.length > limit,
  };
  if (cacheable) pathHistoryCache.set(cacheKey, result);
  return result;
}

/** GET /repos/{owner}/{repo}/commits/{sha} — cached forever-ish because SHAs are immutable. */
async function getCommitDetail(client, { owner, repo, sha, counter = createCounter() }) {
  const key = `${repoId(owner, repo)}@${sha}`;
  if (commitDetailCache.has(key)) {
    counter.githubCached++;
    return commitDetailCache.get(key);
  }
  counter.github++;
  const { data } = await client.rest.repos.getCommit({ owner, repo, ref: sha });
  const detail = normalizeCommitDetail(data);
  commitDetailCache.set(key, detail);
  return detail;
}

/**
 * GET /repos/{owner}/{repo}/contents/{path}?ref=... Returns null when the file
 * does not exist at that ref, is a directory, or is too large for inline content.
 */
async function getFileContentAt(client, { owner, repo, path, ref, counter = createCounter() }) {
  try {
    counter.github++;
    const { data } = await client.rest.repos.getContent({ owner, repo, path, ref });
    if (Array.isArray(data) || data.type !== 'file') return { content: null, reason: 'not_a_file' };
    if (!data.content || data.encoding === 'none') return { content: null, reason: 'too_large' };
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    if (content.includes('\0')) return { content: null, reason: 'binary' };
    return { content, reason: null };
  } catch (err) {
    if (err.status === 404) return { content: null, reason: 'not_found' };
    throw err;
  }
}

/**
 * Fetch the history of one file, following renames backwards where GitHub's
 * commit data proves them (status "renamed" + previous_filename on the oldest
 * commit of each segment). Path-filtered listing does NOT follow renames on its
 * own, so every gap we cannot close is reported in `gaps`.
 */
async function fetchFileHistory(client, {
  owner,
  repo,
  path,
  ref,
  maxCommits = 150,
  maxRenameHops = 3,
  counter = createCounter(),
}) {
  const commits = [];
  const seen = new Set();
  const renames = [];
  const gaps = [];
  const segments = [];
  const details = new Map();
  let truncated = false;
  let originConfirmed = false;

  let currentPath = path;
  let currentRef = ref;

  for (let hop = 0; hop <= maxRenameHops; hop++) {
    const remaining = maxCommits - commits.length;
    if (remaining <= 0) {
      truncated = true;
      gaps.push(`History is capped at ${maxCommits} commits; older changes are not included.`);
      break;
    }

    const listing = await listPathCommits(client, {
      owner, repo, path: currentPath, ref: currentRef, limit: remaining, counter,
    });
    const fresh = listing.commits.filter(c => !seen.has(c.sha));
    fresh.forEach(c => seen.add(c.sha));
    commits.push(...fresh);
    segments.push({ path: currentPath, commitCount: fresh.length });

    if (listing.truncated) {
      truncated = true;
      gaps.push(`${currentPath} has more commits than the ${maxCommits}-commit limit; the oldest changes are not included.`);
      break;
    }
    if (fresh.length === 0) break;

    const oldest = fresh[fresh.length - 1];
    const detail = await getCommitDetail(client, { owner, repo, sha: oldest.sha, counter });
    details.set(oldest.sha, detail);
    const change = findFileChange(detail, currentPath);

    if (!change) {
      gaps.push(`Could not confirm how ${currentPath} was created: commit ${oldest.shortSha} lists no entry for it${detail.filesTruncated ? ' (the commit touches more than 300 files)' : ''}.`);
      break;
    }
    if (change.status === 'added') {
      originConfirmed = true;
      break;
    }
    if (change.status === 'renamed' && change.previousFilename) {
      renames.push({ sha: oldest.sha, shortSha: oldest.shortSha, date: oldest.date, from: change.previousFilename, to: currentPath });
      if (hop === maxRenameHops) {
        gaps.push(`Stopped following renames after ${maxRenameHops} moves; ${change.previousFilename} may have older history.`);
        break;
      }
      const parent = oldest.parents[0];
      if (!parent) break;
      currentPath = change.previousFilename;
      currentRef = parent;
      continue;
    }
    gaps.push(`The earliest commit found for ${currentPath} (${oldest.shortSha}) modified the file instead of creating it, so earlier history may exist under a path GitHub did not link.`);
    break;
  }

  return { commits, renames, gaps, segments, truncated, originConfirmed, details };
}

module.exports = {
  createCounter,
  listPathCommits,
  getCommitDetail,
  getFileContentAt,
  fetchFileHistory,
};
