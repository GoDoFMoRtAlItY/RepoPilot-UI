const test = require('node:test');
const assert = require('node:assert/strict');
const GemmaProvider = require('../src/services/ai/providers/GemmaProvider');

function withEnv(env, fn) {
  const keys = ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'OLLAMA_URL', 'GEMMA_BACKEND', 'AI_PROVIDER', 'GEMMA_MODEL', 'GEMMA_OLLAMA_MODEL'];
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  keys.forEach(k => delete process.env[k]);
  Object.assign(process.env, env);
  try { return fn(); } finally { keys.forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }); }
}

test('backend resolution order and model ids', () => {
  const g = new GemmaProvider();
  withEnv({ GEMINI_API_KEY: 'AIza1', OPENROUTER_API_KEY: 'sk-or' }, () => {
    assert.deepEqual(g.resolveBackend(), { backend: 'gemini', key: 'AIza1' });
    assert.equal(g.modelFor('gemini'), 'gemma-4-31b-it');
  });
  withEnv({ GEMINI_API_KEY: 'AIza1', OPENROUTER_API_KEY: 'sk-or', AI_PROVIDER: 'openrouter' }, () => {
    assert.equal(g.resolveBackend().backend, 'openrouter');
    assert.equal(g.modelFor('openrouter'), 'google/gemma-4-31b-it');
  });
  withEnv({ OLLAMA_URL: 'http://localhost:11434', GEMMA_OLLAMA_MODEL: 'gemma4:e2b' }, () => {
    assert.equal(g.resolveBackend().backend, 'ollama');
    assert.equal(g.modelFor('ollama'), 'gemma4:e2b');
  });
  withEnv({ GEMINI_API_KEY: 'AIza1', OLLAMA_URL: 'http://x', GEMMA_BACKEND: 'ollama' }, () => {
    assert.equal(g.resolveBackend().backend, 'ollama');
  });
});

test('BYOK key is used only for providers that serve Gemma', () => {
  const g = new GemmaProvider();
  withEnv({ OPENROUTER_API_KEY: 'server-key' }, () => {
    assert.deepEqual(g.resolveBackend('user-key', 'gemini'), { backend: 'gemini', key: 'user-key' });
    assert.deepEqual(g.resolveBackend('user-key', 'anthropic'), { backend: 'openrouter', key: 'server-key' });
  });
});

test('placeholder keys from .env.example count as not configured', () => {
  const g = new GemmaProvider();
  withEnv({ GEMINI_API_KEY: 'your_gemini_api_key_here', OPENROUTER_API_KEY: 'your_openrouter_api_key_here' }, () => {
    assert.throws(() => g.resolveBackend(), /not configured/);
  });
});
