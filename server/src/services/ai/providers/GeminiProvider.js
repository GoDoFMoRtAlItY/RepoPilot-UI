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

    const systemPrompt = `You are an experienced software engineer writing a clean, professional, human-written README for a project.

REQUIRED SECTIONS (Use HTML tags for all structuring):
1. <h1 align="center">[Project Name]</h1>
2. <p align="center"><strong>[One-line summary explaining the core purpose of the project]</strong></p>
3. <h2>About the Project</h2>
   Explain clearly in natural developer language, using HTML lists (<ul><li>):
   - What the repository is for (its primary intent and target domain).
   - What it is (its architectural identity, project type, and key modules).
   - How it works (how components flow and communicate under the hood).
   - How it is used (practical scenarios, how users/developers interact with it, and what problem it solves).
4. <h2>Quick Start</h2>
   Clean bash commands for installation, configuration, and execution wrapped in <pre><code>.
5. <h2>Environment Variables</h2>
6. <h2>API Endpoints</h2>
7. <h2>Tech Stack</h2>

STRICT FORMATTING & TONE RULES:
- IMPORTANT: You MUST use HTML tags (<h1>, <h2>, <p>, <strong>, <ul>, <li>, <blockquote>, <br>, <pre>, <code>) for all structuring and formatting.
- ABSOLUTELY DO NOT use standard markdown symbols like '#', '*', '-', or '>' for formatting. Do not use markdown headers, bolding, or lists. ONLY use HTML tags.
- Write naturally like a human engineer writing clear documentation, similar to top-tier enterprise repositories (e.g., Supabase).
- ABSOLUTELY NO EMOJIS OR DECORATIVE UNICODE SYMBOLS anywhere in the text or headers.
- Avoid robotic openings ("This project is designed to...", "In summary").
- Output ONLY the raw content without markdown codeblock wrappers or conversational text.`;

    const userPrompt = `Repository Analysis Data:\n${JSON.stringify(analysisJson, null, 2)}`;
    let readme = await this._callGemini(key, 'gemini-2.0-flash', [systemPrompt, { text: userPrompt }]);
    return readme.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/i, '');
  }
}

module.exports = GeminiProvider;
