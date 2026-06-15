const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI chat grounding service using Gemini
 */
async function askQuestion(question, analysisJson, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    const result = await model.generateContent([
      systemPrompt,
      { text: `User Question: ${question}` }
    ]);

    const answer = result.response.text();
    
    // Extract citations (basic regex extraction for the specific format)
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
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw new Error('Failed to get answer from AI: ' + error.message);
  }
}

/**
 * Fallback mechanism when no API key is provided
 */
function generateFallbackAnswer(question, analysisJson) {
  const q = question.toLowerCase();
  
  if (q.includes('work') || q.includes('what is this')) {
    return `**Project Summary**: ${analysisJson.summary.oneLiner}\n\n**Entry Point**: The application starts at [${analysisJson.entryPoint.file}:L${analysisJson.entryPoint.line}](${analysisJson.entryPoint.githubUrl}). This was detected because: ${analysisJson.entryPoint.reason}.`;
  }
  
  if (q.includes('run') || q.includes('setup') || q.includes('start')) {
    const steps = analysisJson.setupSteps.map(s => `${s.order}. **${s.title}**\n   \`${s.command}\`\n   _${s.description}_`).join('\n\n');
    return `Here is how to set up the project:\n\n${steps}`;
  }
  
  if (q.includes('env') || q.includes('environment')) {
    if (!analysisJson.envVars.length) return "No environment variables were detected in this repository.";
    const vars = analysisJson.envVars.map(e => `- \`${e.name}\`: ${e.required ? 'Required' : 'Optional'}${e.defaultValue ? ` (Default: ${e.defaultValue})` : ''} [Source](${e.githubUrl})`).join('\n');
    return `Here are the detected environment variables:\n\n${vars}`;
  }
  
  if (q.includes('route') || q.includes('api') || q.includes('endpoint')) {
    if (!analysisJson.routes.length) return "No API routes were detected in this repository.";
    const rts = analysisJson.routes.slice(0, 10).map(r => `- **${r.method}** \`${r.path}\` in [${r.file}:L${r.line}](${r.githubUrl})`).join('\n');
    let extra = analysisJson.routes.length > 10 ? `\n...and ${analysisJson.routes.length - 10} more.` : '';
    return `Here are some of the API routes:\n\n${rts}${extra}`;
  }

  return "I'm in basic mode (no API key provided). I can answer questions about this repo's routes, env vars, APIs, and setup. Try asking about one of those!";
}

module.exports = {
  askQuestion,
  generateFallbackAnswer
};
