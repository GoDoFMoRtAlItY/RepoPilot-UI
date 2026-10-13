const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseProvider = require('./BaseProvider');

/**
 * Gemma 4 provider used by the Time Machine.
 *
 * Gemma is reachable through three backends; the first configured one wins
 * (override with GEMMA_BACKEND=gemini|openrouter|ollama):
 *   - gemini      Google AI Studio / Gemini API (GEMINI_API_KEY)      model: gemma-4-31b-it
 *   - openrouter  OpenRouter (OPENROUTER_API_KEY)                      model: google/gemma-4-31b-it
 *   - ollama      Local Ollama server (OLLAMA_URL, e.g. http://localhost:11434) model: gemma4:e4b
 *
 * Model ids can be overridden with GEMMA_MODEL (gemini/openrouter) or
 * GEMMA_OLLAMA_MODEL. The methods return RAW model text; parsing and schema
 * validation happen in services/history/storySchema.js so nothing the model
 * says reaches the frontend unchecked.
 */
const DEFAULT_MODELS = {
  gemini: 'gemma-4-31b-it',
  openrouter: 'google/gemma-4-31b-it',
  ollama: 'gemma4:e4b',
};

class GemmaProvider extends BaseProvider {
  constructor() {
    super('Gemma');
  }

  _timeout() {
    return Number(process.env.GEMMA_TIMEOUT_MS || process.env.AI_REQUEST_TIMEOUT_MS || 90000);
  }

  /**
   * Decide which backend + credential to use. A user-supplied key (BYOK) is
   * only used when the user's selected provider can actually serve Gemma.
   */
  resolveBackend(overrideKey, hint) {
    const hintLc = (hint || '').toLowerCase();
    if (overrideKey && (hintLc === 'gemini' || hintLc === 'openrouter')) {
      return { backend: hintLc, key: overrideKey.trim() };
    }

    const forced = (process.env.GEMMA_BACKEND || 'auto').toLowerCase();
    const primary = (process.env.AI_PROVIDER || '').toLowerCase();
    let order = ['gemini', 'openrouter', 'ollama'];
    if (forced !== 'auto') order = [forced];
    else if (primary === 'openrouter') order = ['openrouter', 'gemini', 'ollama'];

    // Treat the .env.example placeholders ("your_..._here") as unset.
    const real = v => (v && !/^your_.*_here$/i.test(v.trim()) ? v.trim() : null);
    for (const backend of order) {
      if (backend === 'gemini' && real(process.env.GEMINI_API_KEY)) return { backend, key: real(process.env.GEMINI_API_KEY) };
      if (backend === 'openrouter' && real(process.env.OPENROUTER_API_KEY)) return { backend, key: real(process.env.OPENROUTER_API_KEY) };
      if (backend === 'ollama' && real(process.env.OLLAMA_URL)) return { backend, key: null };
    }
    // ProviderManager maps "not configured" to the AI_KEY_MISSING response code.
    throw new Error('Gemma is not configured: set GEMINI_API_KEY, OPENROUTER_API_KEY or OLLAMA_URL');
  }

  modelFor(backend) {
    if (backend === 'ollama') return process.env.GEMMA_OLLAMA_MODEL || DEFAULT_MODELS.ollama;
    return process.env.GEMMA_MODEL || DEFAULT_MODELS[backend];
  }

  async _complete(systemPrompt, userPrompt, overrideKey, hint) {
    const { backend, key } = this.resolveBackend(overrideKey, hint);
    const model = this.modelFor(backend);
    let text;
    if (backend === 'gemini') text = await this._callGemini(key, model, systemPrompt, userPrompt);
    else if (backend === 'openrouter') text = await this._callOpenRouter(key, model, systemPrompt, userPrompt);
    else if (backend === 'ollama') text = await this._callOllama(model, systemPrompt, userPrompt);
    else throw new Error(`Unknown Gemma backend: ${backend}`);
    // Returned together (not stored on the instance) so concurrent requests never mix up metadata.
    return { text, backend, model };
  }

  async _callGemini(key, model, systemPrompt, userPrompt) {
    const genAI = new GoogleGenerativeAI(key);
    const m = genAI.getGenerativeModel(
      { model, generationConfig: { temperature: 0.2, maxOutputTokens: 4096 } },
      { timeout: this._timeout() }
    );
    // Instructions are sent as the first content part (same pattern as GeminiProvider),
    // which works whether or not the model accepts a separate system instruction.
    const result = await m.generateContent([systemPrompt, { text: userPrompt }]);
    return result.response.text().trim();
  }

  async _callOpenRouter(key, model, systemPrompt, userPrompt) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          temperature: 0.2,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          timeout: this._timeout(),
          headers: {
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'RepoPilot Time Machine',
            'Content-Type': 'application/json',
          },
        }
      );
      return (response.data?.choices?.[0]?.message?.content || '').trim();
    } catch (err) {
      throw this._wrapAxiosError(err, 'OpenRouter');
    }
  }

  async _callOllama(model, systemPrompt, userPrompt) {
    const base = process.env.OLLAMA_URL.replace(/\/$/, '');
    try {
      const response = await axios.post(
        `${base}/api/chat`,
        {
          model,
          stream: false,
          format: 'json',
          options: { temperature: 0.2 },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        { timeout: this._timeout() }
      );
      return (response.data?.message?.content || '').trim();
    } catch (err) {
      throw this._wrapAxiosError(err, 'Ollama');
    }
  }

  _wrapAxiosError(err, label) {
    if (err.code === 'ECONNABORTED') {
      const e = new Error(`${label} (Gemma) request timed out`);
      e.status = 504;
      return e;
    }
    if (err.response) {
      const e = new Error(`${label} (Gemma) error: ${err.response.data?.error?.message || err.response.data?.error || err.message}`);
      e.status = err.response.status;
      return e;
    }
    return err;
  }

  /**
   * @param {{systemPrompt: string, userPrompt: string, backendHint?: string}} payload
   * @returns {Promise<{text: string, backend: string, model: string}>}
   */
  async generateFileStory(payload, overrideKey) {
    return this._complete(payload.systemPrompt, payload.userPrompt, overrideKey, payload.backendHint);
  }

  async generateRepoEvolution(payload, overrideKey) {
    return this._complete(payload.systemPrompt, payload.userPrompt, overrideKey, payload.backendHint);
  }
}

module.exports = GemmaProvider;
