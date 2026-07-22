const axios = require('axios');
const BaseProvider = require('./BaseProvider');

class OpenRouterProvider extends BaseProvider {
  constructor() {
    super('OpenRouter');
  }

  _getKey(overrideKey) {
    const key = overrideKey || process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY is not configured');
    return key;
  }

  _getModel() {
    // The former `:free` slug was retired by OpenRouter and now returns 404.
    // Keep this configurable, but use the provider's currently valid slug by
    // default so file descriptions work with the configured account.
    return process.env.OPENROUTER_MODEL || 'qwen/qwen3-30b-a3b';
  }

  async _callOpenRouter(systemPrompt, userPrompt, overrideKey) {
    const key = this._getKey(overrideKey);
    const model = this._getModel();

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        },
        {
          timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS || 60000),
          headers: {
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter, can be any valid URL
            'X-Title': 'RepoPilot', 
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        const error = new Error('OpenRouter request timed out');
        error.status = 504;
        throw error;
      }
      if (err.response) {
        const status = err.response.status;
        const error = new Error(`OpenRouter Error: ${err.response.data?.error?.message || err.message}`);
        error.status = status;
        throw error;
      }
      throw err;
    }
  }

  async generateDetailedAnalysis(fileName, fileContent, overrideKey) {
    const systemPrompt = `You are an experienced software engineer and system architect.
Your task is to provide a highly detailed, comprehensive analysis of the provided source code file.
Output your response formatted in Markdown with the following exact sections:

## 📝 Summary
(Provide a brief 1-2 sentence high-level overview of what this file does)

## 🎯 Responsibilities
(List the core responsibilities and roles this file plays in the broader architecture)

## 🛠️ Key Functions & Classes
(Identify the main functions, classes, or React components and explain what they do)

## 🔍 Code Walkthrough (Line-by-Line)
(Break down the most important sections of the code, providing code snippets and easy-to-understand explanations for each logic block or crucial lines)

Avoid heavy jargon when possible, but remain technically accurate. Make it easily digestible for a developer onboarding onto the project.`;

    const userPrompt = `Please perform a detailed analysis on this file: ${fileName}\n\nContent:\n${fileContent}`;

    return await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
  }

  async generateFileDescription(fileName, compressedContext, overrideKey) {
    const systemPrompt = `Explain what this file does, why it exists, and its role in the project. Explain for a beginner. Maximum three short sentences.`;
    const userPrompt = `File: ${fileName}\n\nContext:\n${compressedContext}`;
    return await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
  }

  async answerQuestion(question, analysisJson, overrideKey) {
    const systemPrompt = `You are RepoPilot, a friendly code onboarding assistant. You help beginners understand a GitHub repository based ONLY on the verified analysis data provided below.

STRICT RULES:
1. Answer ONLY from the provided analysis data — never make up information
2. ALWAYS cite sources with exact file path and line number in this format: [filename:L{line}](githubUrl)
3. Keep answers beginner-friendly — explain jargon when you use it
4. Use markdown formatting: headers, bullet points, code blocks
5. If the data doesn't contain enough info, say: "I don't have enough information about that from the analysis. Try asking about routes, environment variables, APIs, or the project setup."
6. When discussing routes, mention the HTTP method and path
7. When discussing env vars, mention if they're required or have defaults
8. When discussing APIs/packages, explain what category they fall in

REPOSITORY ANALYSIS DATA:
${JSON.stringify(analysisJson, null, 2)}`;

    const userPrompt = `User Question: ${question}`;

    const answer = await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);

    const citations = [];
    const citationRegex = /\[([^:]+):L(\d+)\]\(([^)]+)\)/g;
    let match;
    while ((match = citationRegex.exec(answer)) !== null) {
      citations.push({
        file: match[1],
        line: parseInt(match[2], 10),
        githubUrl: match[3]
      });
    }

    return { answer, citations };
  }

  async generateExecutiveSummary(analysisJson, overrideKey) {
    const systemPrompt = `You are an expert software architect.
Your task is to write EXACTLY ONE concise executive summary of the provided repository analysis.
Maximum 100 words. No formatting, no bullet points, just a single paragraph.
Focus on the architecture, primary stack, and overall purpose.`;

    const userPrompt = `Repository Analysis: ${JSON.stringify({
      summary: analysisJson.summary,
      tech: analysisJson.summary.primaryTechStack,
      type: analysisJson.summary.projectType,
      maturity: analysisJson.summary.projectMaturity
    })}`;

    return await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
  }

  async generateSecurityReview(analysisJson, overrideKey) {
    const systemPrompt = `You are a Senior DevSecOps Architect.
Your task is to write EXACTLY ONE concise security review of the provided repository based on its static analysis findings.
Maximum 150 words. Focus on the overall security posture, key vulnerabilities, exposed secrets, and general adherence to best practices.
Provide a high-level summary paragraph. No formatting, no bullet points, just a single paragraph.`;

    const userPrompt = `Repository Security Analysis: ${JSON.stringify({
      score: analysisJson.securityScore,
      secrets: analysisJson.securityAlerts?.filter(a => a.type === 'Exposed Secret').length || 0,
      vulnerabilities: analysisJson.dependencySecurity?.length || 0,
      config: analysisJson.configSecurity,
      bestPractices: analysisJson.bestPractices,
      hygiene: analysisJson.gitHygiene?.length || 0,
      recommendations: analysisJson.securityRecommendations
    })}`;

    return await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
  }

  async generateApiExplanation(route, overrideKey) {
    const systemPrompt = `You are a Senior API Architect.
Your task is to write EXACTLY ONE concise explanation of what this specific API endpoint does.
Maximum 120 words. Be technical but easy to understand for a new developer.
No formatting, no bullet points, just a single paragraph. Focus on the method, path, and purpose.`;

    const userPrompt = `Endpoint Details: ${JSON.stringify({
      method: route.method,
      path: route.path,
      description: route.description,
      parameters: route.parameters,
      dbOperations: route.dbOperations,
      externalApis: route.externalApis,
      auth: route.auth
    })}`;

    return await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
  }
}

module.exports = OpenRouterProvider;
