const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

/**
 * Generate a clean, comprehensive, human-written README.md based on analysis data
 */
async function generateReadme(analysisJson, apiKey) {
  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  const openRouterKey = (apiKey && apiKey.startsWith('sk-or-v1-')) ? apiKey : process.env.OPENROUTER_API_KEY;
  const geminiKey = (apiKey && !apiKey.startsWith('sk-or-v1-')) ? apiKey : process.env.GEMINI_API_KEY;

  const systemPrompt = `You are a helpful software engineer writing documentation for your team. Write a clean, natural, human-written README.md for this repository.

REQUIRED SECTIONS:
1. # [Project Name]
2. **[Clear 1-sentence summary explaining what the project does at the very top]**
3. ## About the Project
   Write engaging, natural paragraphs covering:
   - ### What the Repository is For: The core goal, target domain, and problem this software solves.
   - ### What It Is: The architecture, project structure, frontend/backend components, and main modules.
   - ### How It Works: How data and control flow through the application from the entry point, APIs, and background processes.
   - ### How It Is Used: Real-world usage, local development workflow, and integration options.
4. ## Quick Start
   Clean, practical bash commands for setting up and running the app locally.
5. ## Environment Variables (if applicable)
6. ## API Endpoints (if applicable)
7. ## Tech Stack

STRICT FORMATTING & TONE RULES:
- Write in a natural, direct, human developer voice.
- ABSOLUTELY NO EMOJIS, DECORATIVE SYMBOLS, BADGES, OR EM-DASHES anywhere.
- Do not use robotic intro template language ("This project is designed to...", "In summary").
- Use standard Markdown headers (# for title, ## for main sections, ### for subsections).
- Output ONLY raw Markdown without codeblock wrappers or chat conversational intro text.`;

  const userPrompt = `Repository Analysis Data:\n${JSON.stringify(analysisJson, null, 2)}`;

  // 1. Try OpenRouter if configured or key provided
  if (openRouterKey) {
    try {
      const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free';
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
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'RepoPilot',
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data?.choices?.[0]?.message?.content) {
        let content = response.data.choices[0].message.content.trim();
        return content.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/i, '');
      }
    } catch (err) {
      console.warn('[aiReadme] OpenRouter README generation failed:', err.message);
    }
  }

  // 2. Try Gemini if configured or key provided
  if (geminiKey && !geminiKey.startsWith('sk-or-v1-')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([
        systemPrompt,
        { text: userPrompt }
      ]);
      let content = result.response.text().trim();
      return content.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/i, '');
    } catch (err) {
      console.warn('[aiReadme] Gemini README generation failed:', err.message);
    }
  }

  // 3. Fallback to clean human-written structured fallback
  console.log('[aiReadme] Using structured fallback README generator');
  return generateFallbackReadme(analysisJson);
}

/**
 * Clean fallback README when no API key is provided
 */
function generateFallbackReadme(analysisJson) {
  const { summary, setupSteps, envVars, routes, apis } = analysisJson || {};
  const { owner, repo, description } = analysisJson?.meta || { owner: 'Owner', repo: 'Project' };

  const projectType = summary?.projectType || 'Software Application';
  const archType = summary?.architectureType || 'Modular Architecture';
  const stackList = (summary?.primaryTechStack || []).join(', ') || 'Node.js, JavaScript';
  const entryFile = analysisJson?.entryPoint?.file || 'the main entry point';

  let readme = `# ${repo || 'Project'}\n\n`;

  // 1. One-line project summary at the top
  const oneLiner = summary?.oneLiner || `${repo || 'This software'} is a ${projectType} built using ${stackList}.`;
  readme += `**${oneLiner}**\n\n`;

  // 2. Detailed project overview
  readme += `## About the Project\n\n`;
  
  readme += `### What the Repository is For\n`;
  readme += `This repository contains the codebase for ${repo || 'the application'}. It provides developers and maintainers with an organized environment to build, test, and deploy ${projectType.toLowerCase()} features effectively.\n\n`;

  readme += `### What It Is\n`;
  readme += `${repo || 'The project'} is structured as a ${projectType} utilizing a ${archType}. `;
  if (description) {
    readme += `${description} `;
  }
  readme += `It combines backend logic, client interfaces, data models, and API utilities using ${stackList}.\n\n`;

  readme += `### How It Works\n`;
  readme += `Execution starts at \`${entryFile}\`. Incoming requests pass through middleware layers to handle routing, authentication, and validation before reaching core services. `;
  if (routes && routes.length > 0) {
    readme += `The application exposes ${routes.length} active API endpoints for system communication. `;
  }
  if (envVars && envVars.length > 0) {
    readme += `System behavior and external connections are configured using ${envVars.length} environment variables. `;
  }
  readme += `\n\n`;

  readme += `### How It Is Used\n`;
  readme += `Developers can clone the repository, install dependencies, configure environment settings, and launch the application locally or in production environments. It can operate as a standalone service or integrate with existing technical pipelines.\n\n`;

  // 3. Quick Start
  readme += `## Quick Start\n\n`;
  if (setupSteps && setupSteps.length > 0) {
    readme += `\`\`\`bash\n`;
    setupSteps.forEach(step => {
      readme += `# ${step.title}\n${step.command}\n\n`;
    });
    readme = readme.trimEnd() + `\n\`\`\`\n\n`;
  } else {
    readme += `\`\`\`bash\n# Install project dependencies\nnpm install\n\n# Start the development server\nnpm run dev\n\`\`\`\n\n`;
  }

  // 4. Environment Variables
  if (envVars && envVars.length > 0) {
    readme += `## Environment Variables\n\nConfigure the following environment keys in your .env file:\n\n`;
    readme += `| Key | Required | Default |\n| --- | --- | --- |\n`;
    envVars.forEach(ev => {
      readme += `| \`${ev.name}\` | ${ev.required ? 'Yes' : 'No'} | ${ev.defaultValue ? `\`${ev.defaultValue}\`` : '-'} |\n`;
    });
    readme += '\n';
  }

  // 5. API Endpoints
  if (routes && routes.length > 0) {
    readme += `## API Endpoints\n\n`;
    readme += `| Method | Endpoint Path | Source File |\n| --- | --- | --- |\n`;
    routes.slice(0, 15).forEach(rt => {
      readme += `| \`${rt.method}\` | \`${rt.path}\` | \`${rt.file}\` |\n`;
    });
    if (routes.length > 15) {
      readme += `\n*${routes.length - 15} additional endpoints omitted for brevity.*\n`;
    }
    readme += '\n';
  }

  // 6. Tech Stack
  if (apis && apis.length > 0) {
    readme += `## Tech Stack\n\n`;
    const categories = {};
    apis.forEach(api => {
      if (!categories[api.category]) categories[api.category] = [];
      categories[api.category].push(api.name);
    });
    
    for (const [cat, items] of Object.entries(categories)) {
      const categoryName = cat.charAt(0).toUpperCase() + cat.slice(1);
      readme += `${categoryName}: ${items.join(', ')}\n\n`;
    }
  }

  return readme.trim();
}

module.exports = {
  generateReadme,
  generateFallbackReadme
};
