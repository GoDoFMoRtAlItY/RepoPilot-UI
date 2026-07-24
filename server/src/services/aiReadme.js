const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate a README.md based on the analysis data
 */
async function generateReadme(analysisJson, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `You are a practical senior software engineer writing a clean, professional, and authentic README.md for a project.

GUIDELINES FOR HUMAN TONE:
1. Write in a natural, direct developer voice.
2. AVOID corporate fluff, generic promotional hype ("This revolutionary project...", "State-of-the-art solution"), or AI clichés ("In summary", "Seamlessly integrates", "Delve into").
3. Include these practical sections:
   - # Project Title & One-line Summary
   - ## Overview
   - ## Tech Stack & Architecture
   - ## Quick Start / Local Setup (with exact copy-paste commands)
   - ## Environment Variables
   - ## Key Endpoints / API Overview (if applicable)
4. Make code blocks clean, bash/shell ready, and tables readable.
5. Output ONLY raw markdown without backtick codeblock wrappers or chat intro text.`;

    const result = await model.generateContent([
      systemPrompt,
      { text: `Repository Analysis Data:\n${JSON.stringify(analysisJson, null, 2)}` }
    ]);

    let readmeContent = result.response.text();
    // Clean up any markdown code block fences if the AI wrapped the whole response
    readmeContent = readmeContent.replace(/^```markdown\n/, '').replace(/\n```$/, '').replace(/^```\n/, '');

    return readmeContent;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw new Error('Failed to generate README: ' + error.message);
  }
}

/**
 * Fallback when no API key is provided
 */
function generateFallbackReadme(analysisJson) {
  const { summary, entryPoint, setupSteps, envVars, routes, apis } = analysisJson;
  const { owner, repo } = analysisJson.meta || { owner: 'Owner', repo: 'Repo' };

  let readme = `# ${repo}\n\n`;
  if (summary.oneLiner) {
    readme += `${summary.oneLiner}\n\n`;
  }

  readme += `## 🚀 Quick Start\n\n`;
  setupSteps.forEach(step => {
    readme += `### ${step.title}\n${step.description ? `${step.description}\n` : ''}\`\`\`bash\n${step.command}\n\`\`\`\n\n`;
  });

  if (envVars.length > 0) {
    readme += `## ⚙️ Environment Variables\n\nCopy \`.env.example\` to \`.env\` and configure the following keys:\n\n| Key | Required | Default |\n|---|---|---|\n`;
    envVars.forEach(ev => {
      readme += `| \`${ev.name}\` | ${ev.required ? 'Yes' : 'No'} | ${ev.defaultValue ? `\`${ev.defaultValue}\`` : '-'} |\n`;
    });
    readme += '\n';
  }

  if (routes.length > 0) {
    readme += `## 🛣️ API Endpoints\n\n| Method | Endpoint Path | Source File |\n|---|---|---|\n`;
    routes.slice(0, 15).forEach(rt => {
      readme += `| \`${rt.method}\` | \`${rt.path}\` | \`${rt.file}\` |\n`;
    });
    if (routes.length > 15) {
      readme += `\n_*...and ${routes.length - 15} additional endpoints.*_\n`;
    }
    readme += '\n';
  }

  if (apis.length > 0) {
    readme += `## 🛠️ Tech Stack & Packages\n\n`;
    const categories = {};
    apis.forEach(api => {
      if (!categories[api.category]) categories[api.category] = [];
      categories[api.category].push(api.name);
    });
    
    for (const [cat, items] of Object.entries(categories)) {
      readme += `- **${cat.charAt(0).toUpperCase() + cat.slice(1)}**: ${items.join(', ')}\n`;
    }
  }

  return readme;
}

module.exports = {
  generateReadme,
  generateFallbackReadme
};
