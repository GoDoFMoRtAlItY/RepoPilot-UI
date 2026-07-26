const axios = require('axios');
const BaseProvider = require('./BaseProvider');

class OpenRouterProvider extends BaseProvider {
  constructor() {
    super('OpenRouter');
  }

  _getKey(overrideKey) {
    const key = overrideKey || process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY is not configured');
    return key.trim();
  }

  _getModel() {
    // The former `:free` slug was retired by OpenRouter and now returns 404.
    // Keep this configurable, but use the provider's currently valid slug by
    // default so file descriptions work with the configured account.
    return process.env.OPENROUTER_MODEL || 'openrouter/free';
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
    const systemPrompt = `You are a helpful, clear, and highly descriptive coding assistant writing a beginner-friendly code walkthrough.

TONE & STYLE RULES:
- Write in a clear, descriptive, and beginner-friendly tone. Avoid overly dense jargon where simple explanations work better.
- Explain the code in a way that someone new to the codebase or framework can easily understand.
- Use the exact emojis in the section headers as specified below.
- Be thorough and structured.

Output in Markdown with these exact sections:

## 📄 Summary
A clear, highly descriptive 2-4 sentence paragraph explaining what this file does, what it integrates with, and what the UI or logic includes. Make it easy to understand for a beginner.

---

## 🎯 Responsibilities
A numbered list of the file's core responsibilities. Each item should have a **bold title** followed by a colon and a clear description. Example format:
1. **Display Active Deliveries**: Fetches and shows the active food delivery tasks.
2. **Location Verification**: Validates the user's proximity to the organization's location.
Cover every major responsibility the file handles in descriptive terms.

## 🛠️ Key Functions & Classes
A numbered list of every significant function, class, component, state object, or method defined in the file. For each one:
- Use the exact function/class name in bold or backticks (e.g. **\`functionName()\`** or **\`ClassName\` (State<Widget>)**)
- Follow with a dash and a descriptive explanation of its purpose
- For complex functions, add indented sub-bullets listing the specific steps or operations it performs in beginner-friendly language

Example format:
1. **\`_AddFoodState\` (State<AddFood>)**
   - Manages the screen's state, including form inputs, loading status, and confetti animation.

2. **\`_addFood()\`**
   - Core logic for processing donations:
     - Validates user authentication and form inputs.
     - Retrieves the user's location.
     - Stores data in the database (using a batch write for atomic operations).
     - Updates the user's count.
     - Sends notifications.
     - Displays success/error messages and triggers confetti.

Be thorough — list ALL significant functions, hooks, handlers, state variables, and classes, explaining their inner workings clearly.`;

    const userPrompt = `Analyze this file in detail in a beginner-friendly way: ${fileName}\n\nFull source code:\n${fileContent}`;

    return await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
  }

  async generateFileDescription(fileName, compressedContext, overrideKey) {
    const systemPrompt = `Explain what this file does, why it exists, and its role in 1-2 direct, natural developer sentences. Avoid corporate fluff, robotic intros ("This file is responsible for..."), emojis, or AI clichés. Speak naturally like a teammate writing code documentation. ABSOLUTELY NO EMOJIS or decorative symbols.`;
    const userPrompt = `File: ${fileName}\n\nContext:\n${compressedContext}`;
    let desc = await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
    return desc.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/ug, '').replace(/—/g, '-').trim();
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

  async generateReadme(analysisJson, overrideKey) {
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
    let readme = await this._callOpenRouter(systemPrompt, userPrompt, overrideKey);
    return readme.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/i, '');
  }
}

module.exports = OpenRouterProvider;
