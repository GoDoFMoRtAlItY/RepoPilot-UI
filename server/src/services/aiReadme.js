const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate a clean, comprehensive, human-written README.md based on analysis data
 */
async function generateReadme(analysisJson, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `You are an experienced open-source maintainer writing a clean, comprehensive README.md for a project.

REQUIRED STRUCTURE:
1. # [Project Name]
2. **[One-line description summarizing the entire project right at the top]**
3. ## About the Project
   - Provide a detailed 2-3 paragraph explanation:
     - WHAT the project is for (its primary purpose, architectural goals, core functionality).
     - WHAT it is used for (practical use cases, how developers or end-users interact with it, and what problem it solves).
     - How its components work together based on the detected stack and files.
4. ## Quick Start
   - Clean bash code blocks for installation and local dev setup.
5. ## Environment Variables (if applicable)
6. ## API Reference / Endpoints (if applicable)
7. ## Tech Stack

FORMATTING & TONE RULES:
- Write naturally in a human developer voice.
- ABSOLUTELY NO EMOJIS in headers or body text (no 🚀, ⚙️, 🛠️, 📝, 💡, etc.).
- Use # once for the title and ## only for major section headers.
- Avoid excessive markdown bolding (**word**) or bullet star clutter on every line.
- Output ONLY raw markdown without codeblock fence wrappers or intro chat text.`;

    const result = await model.generateContent([
      systemPrompt,
      { text: `Repository Analysis Data:\n${JSON.stringify(analysisJson, null, 2)}` }
    ]);

    let readmeContent = result.response.text().trim();
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
  const { owner, repo, description } = analysisJson.meta || { owner: 'Owner', repo: 'Project' };

  const projectType = summary?.projectType || 'Software Application';
  const archType = summary?.architectureType || 'Modular Architecture';
  const stackList = (summary?.primaryTechStack || []).join(', ') || 'Node.js, JavaScript';
  const entryFile = analysisJson.entryPoint?.file || 'the primary entry point';

  let readme = `# ${repo}\n\n`;

  // 1. One-line project description at the top
  const oneLiner = summary?.oneLiner || `${repo} is a ${projectType} built with ${stackList}.`;
  readme += `**${oneLiner}**\n\n`;

  // 2. Detailed project description section
  readme += `## About the Project\n\n`;
  readme += `${repo} is a ${projectType} utilizing a ${archType}. `;
  if (description) {
    readme += `${description} `;
  }
  readme += `It is designed to provide a structured, maintainable code environment powered by ${stackList}.\n\n`;

  readme += `### What It Is Used For\n`;
  readme += `This repository is used to run and deploy ${projectType.toLowerCase()} services. `;
  if (routes && routes.length > 0) {
    readme += `It exposes ${routes.length} application routing endpoints starting from \`${entryFile}\`, facilitating client-server communication and API processing. `;
  }
  if (envVars && envVars.length > 0) {
    readme += `It includes configurable runtime environments managed via ${envVars.length} environment variables. `;
  }
  readme += `Developers can use this project as a foundation for building, testing, and deploying production features.\n\n`;

  // 3. Quick Start
  readme += `## Quick Start\n\n`;
  if (setupSteps && setupSteps.length > 0) {
    readme += `\`\`\`bash\n`;
    setupSteps.forEach(step => {
      readme += `# ${step.title}\n${step.command}\n\n`;
    });
    readme = readme.trimEnd() + `\n\`\`\`\n\n`;
  } else {
    readme += `\`\`\`bash\n# Install dependencies & start dev server\nnpm install\nnpm run dev\n\`\`\`\n\n`;
  }

  // 4. Environment Variables
  if (envVars && envVars.length > 0) {
    readme += `## Environment Variables\n\nConfigure the following environment keys in a .env file:\n\n`;
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
