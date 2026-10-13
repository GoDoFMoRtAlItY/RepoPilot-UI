const express = require('express');
const router = express.Router();

const { octokit } = require('../services/github');
const ProviderManager = require('../services/ai/ProviderManager');
const { getFileStory } = require('../services/history/fileStory');
const { getRepoEvolution } = require('../services/history/repoEvolution');
const { getCommitDetail, createCounter } = require('../services/history/githubHistory');
const { findFileChange, extractStructuralChanges, trimPatch } = require('../services/history/historyNormalizer');

const NAME = /^[A-Za-z0-9_.-]{1,100}$/;
const SHA = /^[0-9a-f]{7,40}$/i;
const REF = /^[A-Za-z0-9._\/-]{1,200}$/;

function validPath(p) {
  return typeof p === 'string' &&
    p.length > 0 && p.length <= 500 &&
    !p.startsWith('/') &&
    !p.split('/').some(seg => seg === '..' || seg === '.' || seg === '') &&
    !/[\0\r\n]/.test(p);
}

function aiFromHeaders(req) {
  return { key: req.headers['x-ai-key'] || undefined, provider: req.headers['x-ai-provider'] || undefined };
}

/** Map GitHub/Octokit errors to the response conventions used by routes/analyze.js. */
function sendGithubError(res, error, fallback) {
  const status = error.status || error.response?.status;
  const message = error.message || '';
  if (status === 404) return res.status(404).json({ error: 'Repository, file or commit not found (or the repository is private).', code: 'NOT_FOUND' });
  if (status === 422) return res.status(422).json({ error: 'GitHub could not resolve that commit or branch. It may have been force-pushed away.', code: 'REF_NOT_FOUND' });
  if (status === 403 || status === 429 || /rate limit|quota exhausted/i.test(message)) {
    const reset = error.response?.headers?.['x-ratelimit-reset'];
    return res.status(429).json({
      error: 'GitHub API rate limit exceeded. Please wait a few minutes and try again.',
      code: 'GITHUB_RATE_LIMITED',
      resetAt: reset ? new Date(Number(reset) * 1000).toISOString() : null,
    });
  }
  if (status === 401 || /Bad credentials/i.test(message)) return res.status(401).json({ error: 'GitHub token is invalid. Update GITHUB_TOKEN in server/.env.', code: 'GITHUB_AUTH' });
  console.error('[TimeMachine]', fallback, message);
  return res.status(500).json({ error: fallback, code: 'TIME_MACHINE_ERROR' });
}

/**
 * POST /api/time-machine/file-story
 * body: { owner, repo, path, ref?, refresh? }
 * Lazily fetches one file's history and returns its Gemma-explained story.
 */
router.post('/file-story', async (req, res) => {
  const { owner, repo, path, ref, refresh } = req.body || {};
  if (!NAME.test(owner || '') || !NAME.test(repo || '')) return res.status(400).json({ error: 'Valid owner and repo are required.' });
  if (!validPath(path)) return res.status(400).json({ error: 'A valid repository-relative file path is required.' });
  if (ref !== undefined && ref !== null && !REF.test(ref)) return res.status(400).json({ error: 'Invalid ref.' });

  try {
    const result = await getFileStory({
      client: octokit,
      providerManager: ProviderManager,
      owner, repo, filePath: path, ref: ref || undefined,
      ai: aiFromHeaders(req),
      refresh: refresh === true,
    });
    return res.json(result);
  } catch (error) {
    return sendGithubError(res, error, 'Failed to build the file history story.');
  }
});

/**
 * GET /api/time-machine/:owner/:repo/commit/:sha?path=...
 * Lazy diff for a single commit (used when a non-milestone timeline entry is expanded).
 */
router.get('/:owner/:repo/commit/:sha', async (req, res) => {
  const { owner, repo, sha } = req.params;
  const { path } = req.query;
  if (!NAME.test(owner) || !NAME.test(repo) || !SHA.test(sha)) return res.status(400).json({ error: 'Invalid owner, repo or commit SHA.' });
  if (path !== undefined && !validPath(path)) return res.status(400).json({ error: 'Invalid file path.' });

  const counter = createCounter();
  try {
    const detail = await getCommitDetail(octokit, { owner, repo, sha, counter });
    const change = path ? findFileChange(detail, path) : null;
    return res.json({
      sha: detail.sha,
      message: detail.message,
      date: detail.date,
      author: detail.authorName,
      commitUrl: detail.htmlUrl || `https://github.com/${owner}/${repo}/commit/${detail.sha}`,
      stats: detail.stats,
      filesChanged: detail.files.length,
      file: change ? {
        path: change.filename,
        previousPath: change.previousFilename,
        status: change.status,
        additions: change.additions,
        deletions: change.deletions,
        facts: extractStructuralChanges(change.patch),
        patch: trimPatch(change.patch, 400),
      } : null,
      meta: { apiCalls: counter },
    });
  } catch (error) {
    return sendGithubError(res, error, 'Failed to load the commit.');
  }
});

/**
 * POST /api/time-machine/repo-evolution
 * body: { owner, repo, ref?, refresh? }
 */
router.post('/repo-evolution', async (req, res) => {
  const { owner, repo, ref, refresh } = req.body || {};
  if (!NAME.test(owner || '') || !NAME.test(repo || '')) return res.status(400).json({ error: 'Valid owner and repo are required.' });
  if (ref !== undefined && ref !== null && !REF.test(ref)) return res.status(400).json({ error: 'Invalid ref.' });

  try {
    const result = await getRepoEvolution({
      client: octokit,
      providerManager: ProviderManager,
      owner, repo, ref: ref || undefined,
      ai: aiFromHeaders(req),
      refresh: refresh === true,
    });
    return res.json(result);
  } catch (error) {
    return sendGithubError(res, error, 'Failed to build the repository timeline.');
  }
});

module.exports = router;
module.exports._internals = { validPath };
