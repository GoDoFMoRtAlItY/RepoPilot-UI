const crypto = require('crypto');
const cache = require('../cache');

const GeminiProvider = require('./providers/GeminiProvider');
const OpenRouterProvider = require('./providers/OpenRouterProvider');
const OpenAIProvider = require('./providers/OpenAIProvider');
const AnthropicProvider = require('./providers/AnthropicProvider');
const KalavaiProvider = require('./providers/KalavaiProvider');
const LocalProvider = require('./providers/LocalProvider');
const MockProvider = require('./providers/MockProvider');

class ProviderManager {
  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      openrouter: new OpenRouterProvider(),
      openai: new OpenAIProvider(),
      anthropic: new AnthropicProvider(),
      kalavai: new KalavaiProvider(),
      local: new LocalProvider(),
      mock: new MockProvider()
    };
  }

  _getFallbackOrder() {
    const primary = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    // Build a list of providers that have credentials configured
    const configured = Object.keys(this.providers).filter((provider) => {
      if (provider === 'openrouter') return Boolean(process.env.OPENROUTER_API_KEY);
      if (provider === 'openai') return Boolean(process.env.OPENAI_API_KEY);
      if (provider === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY);
      if (provider === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
      if (provider === 'kalavai') return Boolean(process.env.KALAVAI_API_KEY);
      if (provider === 'local') return Boolean(process.env.LOCAL_AI_URL);
      return false;
    });
    // Primary goes first, then all other configured providers, then mock
    const order = [primary];
    for (const p of configured) {
      if (p !== primary) order.push(p);
    }
    order.push('mock'); // Always fallback to mock so it never throws
    return order;
  }

  _generateCacheKey(methodName, args) {
    const data = JSON.stringify({ methodName, args });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async execute(methodName, ...args) {
    let overrideKey = null;
    let explicitProvider = null;
    let cacheArgs = [...args];
    
    // Check if the last argument is our override object
    const lastArg = args[args.length - 1];
    if (lastArg && typeof lastArg === 'object' && ('key' in lastArg || 'provider' in lastArg)) {
      overrideKey = lastArg.key;
      explicitProvider = lastArg.provider;
      args[args.length - 1] = overrideKey; // Pass only the key string down to the provider methods
    } else if (typeof lastArg === 'string' && (lastArg.startsWith('sk-') || lastArg.startsWith('AIza'))) {
      overrideKey = lastArg; // Legacy string override fallback
    }

    const cacheKey = this._generateCacheKey(methodName, cacheArgs);
    
    if (cache.has(cacheKey)) {
      console.log(`[AI] Cache Hit | Executing: ${methodName}`);
      return cache.get(cacheKey);
    }

    // If an explicit provider is requested by the user, ONLY try that provider (NO fallback to mock)
    const order = explicitProvider && this.providers[explicitProvider.toLowerCase()] 
      ? [explicitProvider.toLowerCase()]
      : this._getFallbackOrder();

    let lastError = null;

    for (const providerName of order) {
      const provider = this.providers[providerName];
      if (!provider) {
        console.warn(`[AI] Unknown provider: ${providerName}`);
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
      return { success: false, status: 503, code: 'AI_AUTH_FAILED', message: `The AI provider rejected the API key: ${lastError?.message || 'Invalid key'}` };
    }
    if (status === 402) {
      return { success: false, status: 503, code: 'AI_CREDITS_REQUIRED', message: 'The configured AI model needs available provider credits. Choose a funded model or update the provider account.' };
    }
    if (status === 429) {
      return { success: false, status: 429, code: 'AI_RATE_LIMITED', message: 'The AI provider is rate-limiting requests. Please wait a moment and retry.' };
    }

    return { success: false, status: 503, code: 'AI_PROVIDER_UNAVAILABLE', message: `The AI provider failed: ${lastError?.message || 'Unknown error'}` };
  }
}

module.exports = new ProviderManager();
