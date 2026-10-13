/**
 * Builds a small throw-away git repository whose history exercises the Time
 * Machine: file creation, feature additions, a rename/move, a responsibility
 * extraction into another module, and a trivial formatting commit.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function buildFixtureRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-fixture-'));
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  let day = 1;
  const commit = (message) => {
    const date = `2026-01-${String(day++).padStart(2, '0')}T10:00:00Z`;
    git('add', '-A');
    execFileSync('git', ['-C', dir, 'commit', '-q', '-m', message], {
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date, GIT_AUTHOR_NAME: 'Dev One', GIT_AUTHOR_EMAIL: 'dev@example.com', GIT_COMMITTER_NAME: 'Dev One', GIT_COMMITTER_EMAIL: 'dev@example.com' },
    });
  };
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  };

  git('init', '-q', '-b', 'main');

  write('package.json', '{ "name": "fixture", "dependencies": { "express": "^5.0.0" } }\n');
  write('src/auth.js', [
    "const express = require('express');",
    "const router = express.Router();",
    '',
    'function login(req, res) {',
    "  res.json({ ok: true });",
    '}',
    '',
    "router.post('/login', login);",
    'module.exports = router;',
    '',
  ].join('\n'));
  commit('Initial project setup with login route');

  write('src/auth.js', [
    "const express = require('express');",
    "const Joi = require('joi');",
    "const jwt = require('jsonwebtoken');",
    "const router = express.Router();",
    '',
    'const schema = Joi.object({ email: Joi.string().email(), password: Joi.string().min(8) });',
    '',
    'function validateLogin(body) {',
    '  return schema.validate(body);',
    '}',
    '',
    'function signToken(user) {',
    "  return jwt.sign({ id: user.id }, process.env.JWT_SECRET);",
    '}',
    '',
    'function login(req, res) {',
    '  const { error } = validateLogin(req.body);',
    '  if (error) return res.status(400).json({ error: error.message });',
    '  res.json({ token: signToken({ id: 1 }) });',
    '}',
    '',
    "router.post('/login', login);",
    'module.exports = router;',
    '',
  ].join('\n'));
  commit('feat: add request validation and JWT tokens to login');

  // Move the file into a controllers folder (pure rename so git detects it).
  fs.mkdirSync(path.join(dir, 'src/controllers'), { recursive: true });
  git('mv', 'src/auth.js', 'src/controllers/authController.js');
  commit('refactor: move auth into controllers folder');

  // Extract token logic into a separate service.
  write('src/services/tokenService.js', [
    "const jwt = require('jsonwebtoken');",
    '',
    'function signToken(user) {',
    "  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });",
    '}',
    '',
    'module.exports = { signToken };',
    '',
  ].join('\n'));
  write('src/controllers/authController.js', [
    "const express = require('express');",
    "const Joi = require('joi');",
    "const { signToken } = require('../services/tokenService');",
    "const router = express.Router();",
    '',
    'const schema = Joi.object({ email: Joi.string().email(), password: Joi.string().min(8) });',
    '',
    'function validateLogin(body) {',
    '  return schema.validate(body);',
    '}',
    '',
    'function login(req, res) {',
    '  const { error } = validateLogin(req.body);',
    '  if (error) return res.status(400).json({ error: error.message });',
    '  res.json({ token: signToken({ id: 1 }) });',
    '}',
    '',
    'function logout(req, res) {',
    '  res.status(204).end();',
    '}',
    '',
    "router.post('/login', login);",
    "router.post('/logout', logout);",
    'module.exports = router;',
    '',
  ].join('\n'));
  commit('refactor: extract token signing into tokenService and add logout');

  // Trivial formatting commit.
  const p = path.join(dir, 'src/controllers/authController.js');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('function logout(req, res) {', 'function logout(req, res) { '));
  commit('style: whitespace');

  // A feature that is introduced and then reverted (should not become a repo milestone).
  write('src/banner.js', Array.from({ length: 60 }, (_, i) => `export const line${i} = ${i};`).join('\n') + '\n');
  commit('feat: add experimental banner');
  const date = `2026-01-${String(day++).padStart(2, '0')}T10:00:00Z`;
  execFileSync('git', ['-C', dir, 'revert', '--no-edit', 'HEAD'], {
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date, GIT_AUTHOR_NAME: 'Dev One', GIT_AUTHOR_EMAIL: 'dev@example.com', GIT_COMMITTER_NAME: 'Dev One', GIT_COMMITTER_EMAIL: 'dev@example.com' },
    stdio: 'ignore',
  });

  return { dir, git, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

module.exports = { buildFixtureRepo };
