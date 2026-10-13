const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../src/services/history/historyNormalizer');

const PATCH = [
  '@@ -1,6 +1,9 @@',
  " const express = require('express');",
  "-const jwt = require('jsonwebtoken');",
  "+const Joi = require('joi');",
  "+import { signToken } from '../services/tokenService';",
  '-function signToken(user) {',
  '-  return jwt.sign(user);',
  '-}',
  '+function validateLogin(body) {',
  '+  return schema.validate(body);',
  '+}',
  '-function login(req, res) {',
  '+function login(req, res, next) {',
  "+router.post('/logout', logout);",
  '+export const handler = async (req) => {',
].join('\n');

test('extractStructuralChanges separates added, removed and modified names', () => {
  const s = N.extractStructuralChanges(PATCH);
  assert.deepEqual(s.addedImports.sort(), ['../services/tokenService', 'joi']);
  assert.deepEqual(s.removedImports, ['jsonwebtoken']);
  assert.ok(s.addedSymbols.includes('validateLogin'));
  assert.ok(s.addedSymbols.includes('handler'));
  assert.deepEqual(s.removedSymbols, ['signToken']);
  assert.deepEqual(s.modifiedSymbols, ['login']);
  assert.deepEqual(s.addedRoutes, ['POST /logout']);
  assert.deepEqual(s.addedExports, ['handler']);
});

test('extractStructuralChanges tolerates a missing patch', () => {
  const s = N.extractStructuralChanges(null);
  assert.equal(s.linesAdded, 0);
  assert.deepEqual(s.addedImports, []);
});

test('classifyCommit prefers git status, then message keywords', () => {
  assert.equal(N.classifyCommit('whatever', { status: 'added' }), 'origin');
  assert.equal(N.classifyCommit('whatever', { status: 'renamed' }), 'rename');
  assert.equal(N.classifyCommit('feat: add OAuth login', { status: 'modified' }), 'feature');
  assert.equal(N.classifyCommit('refactor: split controller', { status: 'modified' }), 'refactor');
  assert.equal(N.classifyCommit('Fix XSS in comment renderer', { status: 'modified' }), 'security');
  assert.equal(N.classifyCommit('fix: null pointer', { status: 'modified' }), 'fix');
  assert.equal(N.classifyCommit('chore: bump deps', { status: 'modified' }), 'maintenance');
  assert.equal(N.classifyCommit('tweak things', { status: 'modified' }), 'update');
  // An explicit conventional prefix beats keywords found later in the title.
  assert.equal(N.classifyCommit('feat: unify security score', { status: 'modified' }), 'feature');
  assert.equal(N.classifyCommit('Revert "feat: add banner"', { status: 'modified' }), 'revert');
});

function entry(sha, kind, churn, structural = null) {
  return { sha, kind, stats: { additions: churn, deletions: 0 }, structural };
}

test('selectMilestones keeps origin and latest, ranks the rest, skips trivial commits', () => {
  const entries = [
    entry('a', 'origin', 10),
    entry('b', 'maintenance', 1),
    entry('c', 'feature', 120),
    entry('d', 'fix', 3),
    entry('e', 'refactor', 60),
    entry('f', 'update', 2),
  ];
  const picked = N.selectMilestones(entries, 4).map(e => e.sha);
  assert.deepEqual(picked, ['a', 'c', 'e', 'f']); // chronological; 'b' is trivial
});

test('selectMilestones never exceeds max unless forced commits require it', () => {
  const entries = Array.from({ length: 30 }, (_, i) => entry(`s${i}`, i === 0 ? 'origin' : 'feature', i * 3));
  assert.equal(N.selectMilestones(entries, 8).length, 8);
});

test('pickCommitsForDetail is bounded and keeps newest, oldest and significant commits', () => {
  const commits = Array.from({ length: 60 }, (_, i) => ({ sha: `c${i}`, title: i === 30 ? 'refactor: split auth' : `update ${i}` }));
  const picked = N.pickCommitsForDetail(commits, 10);
  assert.equal(picked.length, 10);
  assert.ok(picked.includes('c0'));
  assert.ok(picked.includes('c59'));
  assert.ok(picked.includes('c30'));
  assert.equal(N.pickCommitsForDetail(commits.slice(0, 5), 10).length, 5);
});

test('isNoisePath ignores vendored, generated and lock files only', () => {
  for (const p of ['node_modules/x/index.js', 'server/node_modules/a.d.ts', 'client/package-lock.json', 'dist/app.js', 'static/app.min.js', 'yarn.lock', 'a/b.js.map']) assert.equal(N.isNoisePath(p), true, p);
  for (const p of ['src/index.js', 'package.json', 'builder/index.ts', 'docs/build-guide.md']) assert.equal(N.isNoisePath(p), false, p);
});

test('trimPatch bounds patch size and reports truncation', () => {
  const big = Array.from({ length: 200 }, (_, i) => `+line ${i}`).join('\n');
  const t = N.trimPatch(big, 50);
  assert.equal(t.excerpt.split('\n').length, 50);
  assert.equal(t.truncated, true);
  assert.equal(t.totalLines, 200);
  assert.deepEqual(N.trimPatch(null), { excerpt: null, truncated: false, available: false, totalLines: 0 });
});

test('deterministic narrative is built only from facts', () => {
  const e = { kind: 'feature', title: 'feat: add validation', stats: { additions: 10, deletions: 2 }, structural: N.extractStructuralChanges(PATCH) };
  assert.match(N.deterministicTitle(e), /Routes added: POST \/logout/);
  const text = N.deterministicExplanation(e);
  assert.match(text, /\+10 \/ -2 lines/);
  assert.match(text, /New dependencies: .*joi/);
  assert.ok(!text.includes('`'), 'plain text, no markdown');
});
