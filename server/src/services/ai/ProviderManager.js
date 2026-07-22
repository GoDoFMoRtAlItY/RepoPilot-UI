const crypto = require('crypto');
const cache = require('../cache');

const GeminiProvider = require('./providers/GeminiProvider');
const OpenRouterProvider = require('./providers/OpenRouterProvider');
const KalavaiProvider = require('./providers/KalavaiProvider');
const LocalProvider = require('./providers/LocalProvider');
const MockProvider = require('./providers/MockProvider');

class ProviderManager {
  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      openrouter: new OpenRouterProvider(),
      kalavai: new KalavaiProvider(),
      local: new LocalProvider(),
      mock: new MockProvider()
    };
  }

  _getFallbackOrder() {
    const primary = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
    // Do not try placeholder providers, or providers without credentials. Besides
    // producing misleading logs, this made a real OpenRouter failure look like a
    // generic failure after Gemini, Kalavai and Local had also failed.
    const available = Object.keys(this.providers).filter((provider) => {
      if (provider === 'openrouter') return Boolean(process.env.OPENROUTER_API_KEY);
      if (provider === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
      return false;
    });
    const order = [primary];
    for (const p of available) {
      if (p !== primary) order.push(p);
    }
    order.push('mock'); // Always fallback to mock so it never breaks
    return order;
  }

  _generateCacheKey(methodName, args) {
    const data = JSON.stringify({ methodName, args });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async execute(methodName, ...args) {
    const cacheKey = this._generateCacheKey(methodName, args);
    
    if (cache.has(cacheKey)) {
      console.log(`[AI] Cache Hit | Executing: ${methodName}`);
      return cache.get(cacheKey);
    }

    const order = this._getFallbackOrder();
    let lastError = null;

    for (const providerName of order) {
      const provider = this.providers[providerName];
      if (!provider) {
        console.warn(`[AI] Unknown provider in configuration: ${providerName}`);
        continue;
      }

      try {
        console.log(`[AI] Provider: ${provider.name} | Executing: ${methodName}`);
        
        const data = await provider[methodName](...args);
        
        console.log(`[AI] Provider: ${provider.name} | Status: Success`);
        
        const result = { success: true, data };
        cache.set(cacheKey, result);
        return result;

      } catch (error) {
        lastError = error;
        const statusStr = error.status ? error.status : 'Error';
        console.log(`[AI] Provider: ${provider.name} | Status: ${statusStr} | Detail: ${error.message}`);
        console.log(`[AI] Switching to next provider...`);
      }
    }

    console.error(`[AI] All providers failed. Last error:`, lastError?.message);

    if (lastError?.message && lastError.message.includes('not configured')) {
      return { 
        success: false, 
        status: 400, 
        code: 'AI_KEY_MISSING', 
        message: 'No AI API Key found. Please add OPENROUTER_API_KEY or GEMINI_API_KEY to server/.env, or enter it in the AI Assistant tab.' 
      };
    }

    const status = lastError?.status || lastError?.response?.status;
    if (status === 401 || status === 403) {
      return { success: false, status: 503, code: 'AI_AUTH_FAILED', message: 'The configured AI provider rejected its API key. Update the server AI configuration and try again.' };
    }
    if (status === 402) {
      return { success: false, status: 503, code: 'AI_CREDITS_REQUIRED', message: 'The configured AI model needs available provider credits. Choose a funded model or update the provider account.' };
    }
    if (status === 429) {
      return { success: false, status: 429, code: 'AI_RATE_LIMITED', message: 'The AI provider is rate-limiting requests. Please wait a moment and retry.' };
    }

    return { success: false, status: 503, code: 'AI_PROVIDER_UNAVAILABLE', message: 'The AI provider could not complete this analysis. Check the server logs for the provider error and retry.' };
  }
}

module.exports = new ProviderManager();
