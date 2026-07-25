const BaseProvider = require('./BaseProvider');

class MockProvider extends BaseProvider {
  constructor() {
    super('Mock');
  }

  async generateDetailedAnalysis(fileName, fileContent, overrideKey) {
    // Basic regex to extract classes, functions, and imports
    const imports = (fileContent.match(/^import .* from .*$/gm) || []).map(i => i.replace('import ', '').replace(/ from .*/, ''));
    const functions = (fileContent.match(/function\s+([a-zA-Z0-9_]+)/g) || []).map(f => f.replace('function ', ''));
    const arrows = (fileContent.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g) || []).map(f => f.split('=')[0].replace(/(const|let|var)\s+/, '').trim());
    const allClassesAndFuncs = [...functions, ...arrows];
    
    let summary = `This file appears to be a core module in the application. It handles logic related to ${fileName.split('/').pop().replace(/\.[^/.]+$/, '')}.`;
    
    let functionsList = allClassesAndFuncs.length > 0 
      ? allClassesAndFuncs.map(f => `- **${f}**: Handles specific operations related to this component's domain.`).join('\n')
      : '- No major functions explicitly defined at the top level.';

    let walkthrough = `The code begins by initializing its dependencies, primarily relying on modules like ${imports.length > 0 ? imports.join(', ') : 'standard libraries'}.\n\n`;
    if (allClassesAndFuncs.length > 0) {
      walkthrough += `It then defines several key structures, most notably **${allClassesAndFuncs[0]}**, which serves as the primary entry point for this module's logic. Throughout the execution, the file manages state and data flow securely, ensuring that operations are isolated and resilient against unexpected inputs.\n\n`;
    }
    walkthrough += `*(Note: This is a dynamically generated fallback analysis because the AI providers (OpenRouter/Gemini) are currently rate-limited or out of credits. Normal AI functions will resume when rate limits reset.)*`;

    return `## Summary\n${summary}\n\n## Responsibilities\n- Initialize and manage dependencies for the module.\n- Execute core logic associated with ${fileName}.\n- Provide reusable structures for other components in the system.\n\n## Key Functions & Classes\n${functionsList}\n\n## Code Walkthrough (Line-by-Line)\n${walkthrough}`;
  }

  async generateFileDescription(fileName, compressedContext, overrideKey) {
    const name = fileName.split('/').pop().replace(/\.[^/.]+$/, '');
    return `Core project module that manages application logic and structures for ${name}.`;
  }

  async answerQuestion(question, analysisJson, overrideKey) {
    return {
      answer: `*(Mock AI Fallback)* I am currently running in offline mock mode because the configured AI models are rate-limited or out of credits. \n\nYou asked: "${question}"\n\nTo restore full intelligence, please update your API keys or wait for rate limits to reset.`,
      citations: []
    };
  }

  async generateExecutiveSummary(analysisJson, overrideKey) {
    return "*(Mock AI Fallback)* The repository analysis was completed successfully, but the AI executive summary generation is unavailable due to API rate limits or exhausted credits. Please update the API configuration to restore AI insights.";
  }

  async generateSecurityReview(analysisJson, overrideKey) {
    return "*(Mock AI Fallback)* Security review unavailable due to AI rate limits.";
  }

  async generateApiExplanation(route, overrideKey) {
    return "*(Mock AI Fallback)* API explanation unavailable due to AI rate limits.";
  }

  async generateReadme(analysisJson, overrideKey) {
    const { generateFallbackReadme } = require('../../aiReadme');
    return generateFallbackReadme(analysisJson);
  }
}

module.exports = MockProvider;
