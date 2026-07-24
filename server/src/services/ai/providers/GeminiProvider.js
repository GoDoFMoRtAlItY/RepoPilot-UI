const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseProvider = require('./BaseProvider');

class GeminiProvider extends BaseProvider {
  constructor() {
    super('Gemini');
  }

  _getKey(overrideKey) {
    const key = overrideKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    return key;
  }

  async _callGemini(key, modelName, prompts, retries = 2) {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-2.0-flash' });
    try {
      const result = await model.generateContent(prompts);
      return result.response.text().trim();
    } catch (err) {
      if (err.status === 429 && retries > 0) {
        // Per-minute quota hit — wait 10 s then retry
        console.log(`[Gemini] Rate limited, retrying in 10s... (${retries} retries left)`);
        await new Promise(r => setTimeout(r, 10000));
        return this._callGemini(key, modelName, prompts, retries - 1);
      }
      if (err.status === 429) {
        const error = new Error('Gemini Quota Exceeded');
        error.status = 429;
        throw error;
      }
      throw err;
    }
  }

  async generateDetailedAnalysis(fileName, fileContent, overrideKey) {
    const key = this._getKey(overrideKey);

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

    return await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
  }

  async answerQuestion(question, analysisJson, overrideKey) {
    const key = this._getKey(overrideKey);

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

    const answer = await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: `User Question: ${question}` }]);

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
    const key = this._getKey(overrideKey);

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

    return await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
  }

  async generateSecurityReview(analysisJson, overrideKey) {
    const key = this._getKey(overrideKey);

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

    return await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
  }

  async generateApiExplanation(route, overrideKey) {
    const key = this._getKey(overrideKey);

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

    return await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
  }
}

module.exports = GeminiProvider;
