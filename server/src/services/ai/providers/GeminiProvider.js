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

    const systemPrompt = `You are a pragmatic senior software engineer writing an onboarding code walkthrough for a teammate.

TONE & STYLE RULES:
- Write in a natural, direct developer voice.
- AVOID robotic intros ("This file is responsible for...", "In summary"), corporate fluff, or AI buzzwords ("seamlessly", "leverages", "crucial asset", "delve").
- ABSOLUTELY NO EMOJIS or decorative symbols in headers or text.
- Keep explanations clear, practical, and easy to read.

Output in Markdown with these exact sections:

## Summary
(Provide a brief 1-2 sentence overview of what this file does in natural developer terms)

## Responsibilities
(List the core responsibilities this file handles in the codebase)

## Key Functions & Classes
(Identify main functions, components, or classes and briefly explain what each does)

## Code Walkthrough (Line-by-Line)
(Break down key logic blocks with code snippets and practical explanations)`;

    const userPrompt = `Please perform a detailed analysis on this file: ${fileName}\n\nContent:\n${fileContent}`;

    return await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
  }

  async generateFileDescription(fileName, compressedContext, overrideKey) {
    const key = this._getKey(overrideKey);
    const systemPrompt = `Explain what this file does, why it exists, and its role in 1-2 direct, natural developer sentences. Avoid corporate fluff, robotic intros ("This file is responsible for..."), emojis, or AI clichés. Speak naturally like a teammate writing code documentation. ABSOLUTELY NO EMOJIS or decorative symbols.`;
    const userPrompt = `File: ${fileName}\n\nContext:\n${compressedContext}`;
    let desc = await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
    return desc.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/ug, '').replace(/—/g, '-').trim();
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

  async generateReadme(analysisJson, overrideKey) {
    const key = this._getKey(overrideKey);

    const systemPrompt = `You are an experienced software engineer writing a clean, professional, human-written README.md for a project.

REQUIRED SECTIONS:
1. # [Project Name]
2. **[One-line summary explaining the core purpose of the project at the top]**
3. ## About the Project
   Explain clearly in natural developer language:
   - What the repository is for (its primary intent and target domain).
   - What it is (its architectural identity, project type, and key modules).
   - How it works (how components flow and communicate under the hood).
   - How it is used (practical scenarios, how users/developers interact with it, and what problem it solves).
4. ## Quick Start
   Clean bash commands for installation, configuration, and execution.
5. ## Environment Variables (if applicable)
6. ## API Endpoints (if applicable)
7. ## Tech Stack

STRICT FORMATTING & TONE RULES:
- Write naturally like a human engineer writing clear documentation.
- ABSOLUTELY NO EMOJIS OR DECORATIVE UNICODE SYMBOLS anywhere in the text or headers.
- Do not use special symbols like badges, em-dashes, or decorative icons.
- Use plain, standard Markdown headers (# for title, ## for main sections, ### for subsections).
- Avoid robotic openings ("This project is designed to...", "In summary").
- Output ONLY raw Markdown without codeblock wrappers or chat conversational intro text.`;

    const userPrompt = `Repository Analysis Data:\n${JSON.stringify(analysisJson, null, 2)}`;
    let readme = await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
    return readme.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/i, '');
  }
}

module.exports = GeminiProvider;
