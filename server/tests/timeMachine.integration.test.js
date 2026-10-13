/**
 * End-to-end tests of the Time Machine services against a real local git
 * history (see helpers/fixtureRepo.js) served through an Octokit-shaped stub.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFixtureRepo } = require('./helpers/fixtureRepo');
const { createLocalGitClient } = require('./helpers/localGitClient');
const { fetchFileHistory, listPathCommits, createCounter } = require('../src/services/history/githubHistory');
const { getFileStory } = require('../src/services/history/fileStory');
const { getRepoEvolution } = require('../src/services/history/repoEvolution');
const caches = require('../src/services/history/historyCache');

const fixture = buildFixtureRepo();
test.after(() => fixture.cleanup());

function clearCaches() {
  caches.commitDetailCache.clear();
  caches.pathHistoryCache.clear();
  caches.storyCache.clear();
  caches.evolutionCache.clear();
}

/** Fake ProviderManager that answers like Gemma, using the refs found in the evidence. */
function fakeGemma({ mode = 'valid' } = {}) {
  const pm = {
    calls: 0,
    lastPayload: null,
    async execute(method, payload, override) {
      pm.calls++;
      pm.lastPayload = payload;
      pm.lastOverride = override;
      if (mode === 'down') return { success: false, status: 503, code: 'AI_PROVIDER_UNAVAILABLE', message: 'Gemma is down' };
      if (mode === 'garbage') return { success: true, data: { text: 'I cannot help with that.', backend: 'test', model: 'gemma-test' } };
      const evidence = JSON.parse(payload.userPrompt.replace(/^<evidence>\n/, '').replace(/\n<\/evidence>$/, ''));
      const refs = evidence.milestones.map(m => m.ref);
      if (method === 'generateRepoEvolution') {
        return { success: true, data: { backend: 'test', model: 'gemma-test', text: JSON.stringify({
          overview: 'A small auth service that grew a controller layer.',
          milestones: refs.map(r => ({ milestoneRef: r, title: `Milestone ${r}`, explanation: `Explains ${r}.`, impact: null, confidence: 'medium' })),
        }) } };
      }
      const story = {
        summary: 'The auth controller started as a single login route and was later split.',
        origin: { explanation: 'Handled POST /login.', basis: 'code' },
        chapters: refs.map(r => ({ milestoneRef: r, title: `Chapter ${r}`, explanation: `What ${r} means.`, reasonForChange: 'Stated in the commit message.', reasonBasis: 'commit_message', impact: 'Narrower responsibilities.', confidence: 'high' })),
        architecturalEvolution: 'Token logic moved to tokenService.',
        currentState: { explanation: 'Validates input and delegates token signing.', lingeringInfluences: [{ milestoneRef: refs[1], note: 'Joi validation remains.' }] },
        uncertainties: [],
      };
      // Inject things the validator must remove.
      story.chapters.push({ milestoneRef: 'M99', title: 'Invented', explanation: 'Never happened in 1234abcd.' });
      story.summary += ' See commit 9f9f9f9f9f.';
      return { success: true, data: { text: '```json\n' + JSON.stringify(story) + '\n```', backend: 'test', model: 'gemma-test' } };
    },
  };
  return pm;
}

const FILE = 'src/controllers/authController.js';

test('fetchFileHistory follows a proven rename back to the file origin', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const h = await fetchFileHistory(client, { owner: 'o', repo: 'r', path: FILE, ref: 'main' });
  assert.equal(h.commits.length, 5, 'all five fixture commits touch the file under one of its two paths');
  assert.equal(h.renames.length, 1);
  assert.equal(h.renames[0].from, 'src/auth.js');
  assert.equal(h.renames[0].to, FILE);
  assert.equal(h.originConfirmed, true);
  assert.equal(h.truncated, false);
  assert.deepEqual([...new Set(h.commits.map(c => c.path))], [FILE, 'src/auth.js']);
});

test('history truncation is reported, never assumed complete', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const page = await listPathCommits(client, { owner: 'o', repo: 'r', path: FILE, ref: 'main', limit: 1 });
  assert.equal(page.commits.length, 1);
  assert.equal(page.truncated, true);
  const h = await fetchFileHistory(client, { owner: 'o', repo: 'r', path: FILE, ref: 'main', maxCommits: 2 });
  assert.equal(h.truncated, true);
  assert.ok(h.gaps.length > 0);
});

test('getFileStory merges validated Gemma output with Git facts', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const pm = fakeGemma();
  const res = await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main' });
  assert.equal(res.status, 'ok');
  const s = res.story;

  assert.equal(pm.calls, 1, 'exactly one Gemma call per story');
  assert.equal(pm.lastOverride.provider, 'gemma');
  assert.ok(pm.lastPayload.userPrompt.length < 32000, 'prompt stays within budget');

  assert.equal(s.origin.confirmed, true);
  assert.equal(s.origin.path, 'src/auth.js');
  assert.match(s.origin.message, /Initial project setup/);
  assert.deepEqual(s.file.pathHistory, ['src/auth.js', FILE]);

  // Every chapter maps to a real commit and carries Git facts.
  const realShas = new Set(s.timeline.map(t => t.sha));
  for (const ch of s.chapters) {
    assert.ok(realShas.has(ch.sha));
    assert.equal(ch.source, 'gemma');
    assert.match(ch.commitUrl, /\/commit\/[0-9a-f]{40}$/);
  }
  assert.equal(s.chapters[0].kind, 'origin');
  assert.ok(s.chapters.some(c => c.kind === 'rename' && c.renamedFrom === 'src/auth.js'));
  const extract = s.chapters.find(c => /tokenService/.test(c.message));
  assert.ok(extract, 'the extraction commit is a milestone');
  assert.ok(extract.facts.addedImports.includes('../services/tokenService'));
  assert.ok(extract.facts.removedSymbols.includes('signToken'));
  assert.ok(extract.facts.addedRoutes.includes('POST /logout'));

  // Trivial whitespace commit is not a milestone unless it is the latest change.
  assert.equal(s.chapters.filter(c => c.message === 'style: whitespace').length, 1, 'latest commit always kept as current state');

  // Validator removed the invented chapter and the unknown SHA.
  assert.ok(!s.chapters.some(c => c.ref === 'M99'));
  assert.match(s.summary.text, /\[unverified commit\]/);
  assert.ok(s.ai.issues.some(i => i.includes('M99')));
  assert.equal(s.ai.status, 'partial');

  // Structural comparison between origin and today.
  assert.ok(s.comparison.importsAdded.includes('joi'));
  assert.ok(s.comparison.importsAdded.includes('../services/tokenService'));
  assert.equal(s.currentState.lingeringInfluences.length, 1);
  assert.ok(realShas.has(s.currentState.lingeringInfluences[0].sha));
});

test('reopening an unchanged file is served from cache with no Gemma call', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const pm = fakeGemma();
  const first = await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main' });
  const getCommitCalls = client.calls.getCommit;
  const second = await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main' });
  assert.equal(first.meta.cache, 'miss');
  assert.equal(second.meta.cache, 'hit');
  assert.equal(pm.calls, 1);
  assert.equal(client.calls.getCommit, getCommitCalls, 'no commit-detail calls on a cache hit');
  assert.equal(second.meta.apiCalls.ai, 0);
});

test('concurrent requests for the same story share one Gemma call', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const pm = fakeGemma();
  const [a, b] = await Promise.all([
    getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main' }),
    getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main' }),
  ]);
  assert.equal(pm.calls, 1);
  assert.equal(a.story.generatedAt, b.story.generatedAt);
});

test('Gemma outage still returns a fact-based story and is not cached', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const pm = fakeGemma({ mode: 'down' });
  const res = await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main' });
  assert.equal(res.story.ai.status, 'unavailable');
  assert.ok(res.story.chapters.length >= 3);
  assert.ok(res.story.chapters.every(c => c.source === 'git' && c.explanation.startsWith('Commit message:')));
  const again = await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main' });
  assert.equal(again.meta.cache, 'miss', 'failed AI results are retried, not cached');
  assert.equal(pm.calls, 2);
});

test('unparseable Gemma output is reported as invalid and ignored', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const res = await getFileStory({ client, providerManager: fakeGemma({ mode: 'garbage' }), owner: 'o', repo: 'r', filePath: FILE, ref: 'main' });
  assert.equal(res.story.ai.status, 'invalid');
  assert.ok(res.story.chapters.every(c => c.source === 'git'));
});

test('a path with no commits returns no_history without calling Gemma', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const pm = fakeGemma();
  const res = await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: 'src/does-not-exist.js', ref: 'main' });
  assert.equal(res.status, 'no_history');
  assert.equal(pm.calls, 0);
});

test('a file deleted at the analysed ref is reported as deleted', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const res = await getFileStory({ client, providerManager: fakeGemma(), owner: 'o', repo: 'r', filePath: 'src/auth.js', ref: 'main' });
  assert.equal(res.status, 'ok');
  // At HEAD the old path no longer exists (it was renamed).
  assert.equal(res.story.file.state, 'deleted');
  assert.ok(res.story.history.gaps.some(g => /no longer exists/.test(g)));
});

test('BYOK keys are forwarded only for providers that can serve Gemma', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const pm = fakeGemma();
  await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main', ai: { key: 'sk-ant-xyz', provider: 'anthropic' } });
  assert.equal(pm.lastOverride.key, undefined);
  clearCaches();
  await getFileStory({ client, providerManager: pm, owner: 'o', repo: 'r', filePath: FILE, ref: 'main', ai: { key: 'AIzaTest', provider: 'gemini' } });
  assert.equal(pm.lastOverride.key, 'AIzaTest');
  assert.equal(pm.lastPayload.backendHint, 'gemini');
});

test('repository evolution builds bounded milestones and caches by head SHA', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const pm = fakeGemma();
  const res = await getRepoEvolution({ client, providerManager: pm, owner: 'o', repo: 'r' });
  assert.equal(res.status, 'ok');
  const e = res.evolution;
  assert.equal(e.repository.defaultBranch, 'main');
  assert.ok(e.milestones.length >= 1 && e.milestones.length <= 8);
  assert.ok(e.milestones[0].tags.includes('initial-setup'));
  assert.ok(e.milestones.every(m => m.source === 'gemma'));
  assert.equal(e.window.truncated, false);
  assert.ok(!e.milestones.some(m => /banner/.test(m.message)), 'reverted work is not a milestone');
  assert.equal(e.notes.length, 1);
  assert.match(e.notes[0], /experimental banner/);
  assert.equal(res.meta.apiCalls.github, 1 + 1 + e.window.detailedCommits, 'meta + list + details');
  const again = await getRepoEvolution({ client, providerManager: pm, owner: 'o', repo: 'r' });
  assert.equal(again.meta.cache, 'hit');
  assert.equal(pm.calls, 1);
});

test('counter separates real calls from cached ones', async () => {
  clearCaches();
  const client = createLocalGitClient(fixture.dir);
  const c1 = createCounter();
  const head = (await listPathCommits(client, { owner: 'o', repo: 'r', path: FILE, ref: 'main', counter: c1 })).commits[0].sha;
  const c2 = createCounter();
  await listPathCommits(client, { owner: 'o', repo: 'r', path: FILE, ref: head, counter: c2 });
  await listPathCommits(client, { owner: 'o', repo: 'r', path: FILE, ref: head, counter: c2 });
  assert.equal(c2.github, 1);
  assert.equal(c2.githubCached, 1, 'SHA-pinned listings are cached');
});
