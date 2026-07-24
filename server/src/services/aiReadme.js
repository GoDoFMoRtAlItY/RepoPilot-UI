const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate a clean, human-written README.md based on analysis data
 */
async function generateReadme(analysisJson, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `You are an experienced open-source maintainer writing a clean, professional README.md for a repository.

FORMATTING & TONE RULES:
1. Write naturally like a human developer documenting their project.
2. ABSOLUTELY NO EMOJIS in headers or body text (do NOT use 🚀, ⚙️, 🛠️, 📝, 💡, etc.).
3. DO NOT over-use markdown symbols:
   - Use # once for the main project title at the top.
   - Use ## only for major sections: Overview, Quick Start, Environment Variables, Architecture, API Reference.
   - DO NOT nest multiple sub-headings (###, ####).
   - DO NOT over-bold text or put asterisks on every line. Keep text clean and readable.
4. Keep installation steps concise inside clean bash code blocks:
   \`\`\`bash
   # Clone and setup project
   npm install
   npm run dev
   \`\`\`
5. Output ONLY the raw markdown content. No conversational intro/outro or codeblock fence wrappers.`;

    const result = await model.generateContent([
      systemPrompt,
      { text: `Repository Analysis Data:\n${JSON.stringify(analysisJson, null, 2)}` }
    ]);

    let readmeContent = result.response.text().trim();
    // Clean up any markdown code block fences if the AI wrapped the whole response
    readmeContent = readmeContent.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/i, '');

    return readmeContent;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw new Error('Failed to generate README: ' + error.message);
  }
}

/**
 * Clean fallback README when no API key is provided
 */
function generateFallbackReadme(analysisJson) {
  const { summary, setupSteps, envVars, routes, apis } = analysisJson;
  const { repo } = analysisJson.meta || { repo: 'Project' };

  let readme = `# ${repo}\n\n`;

  if (summary && summary.oneLiner) {
    readme += `${summary.oneLiner}\n\n`;
  }

  readme += `## Quick Start\n\n`;
  if (setupSteps && setupSteps.length > 0) {
    readme += `\`\`\`bash\n`;
    setupSteps.forEach(step => {
      readme += `# ${step.title}\n${step.command}\n\n`;
    });
    readme = readme.trimEnd() + `\n\`\`\`\n\n`;
  } else {
    readme += `\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n`;
  }

  if (envVars && envVars.length > 0) {
    readme += `## Environment Variables\n\nConfigure the following environment keys in a .env file:\n\n`;
    readme += `| Key | Required | Default |\n| --- | --- | --- |\n`;
    envVars.forEach(ev => {
      readme += `| \`${ev.name}\` | ${ev.required ? 'Yes' : 'No'} | ${ev.defaultValue ? `\`${ev.defaultValue}\`` : '-'} |\n`;
    });
    readme += '\n';
  }

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
