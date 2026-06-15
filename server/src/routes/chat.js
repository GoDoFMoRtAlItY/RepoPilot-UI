const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { askQuestion, generateFallbackAnswer } = require('../services/aiChat');

router.post('/', async (req, res) => {
  try {
    const { question, owner, repo } = req.body;
    const apiKey = req.headers['x-ai-key'];
    // const provider = req.headers['x-ai-provider'] || 'gemini'; // if multi-provider was supported
    
    if (!question || !owner || !repo) {
      return res.status(400).json({ error: 'Missing question, owner, or repo' });
    }

    // 1. Get cached analysis for this repo
    const cacheKey = `${owner}/${repo}`;
    const analysis = cache.get(cacheKey);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Repo not analyzed yet. Please analyze first.' });
    }
    
    // 2. Call AI or fallback
    if (apiKey) {
      const result = await askQuestion(question, analysis, apiKey);
      return res.json({ ...result, mode: 'advanced' });
    } else {
      const result = generateFallbackAnswer(question, analysis);
      return res.json({ answer: result, citations: [], mode: 'basic' });
    }
  } catch (err) {
    console.error('Chat endpoint error:', err.message);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

module.exports = router;
