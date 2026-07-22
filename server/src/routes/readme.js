const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { generateReadme, generateFallbackReadme } = require('../services/aiReadme');

router.post('/', async (req, res) => {
  try {
    const { owner, repo } = req.body;
    const apiKey = req.headers['x-ai-key'];
    
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Missing owner or repo' });
    }

    // Get cached analysis for this repo
    const cacheKey = `${owner}/${repo}`;
    const analysis = cache.get(cacheKey);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Repo not analyzed yet. Please analyze first.' });
    }
    
    // Call AI or fallback
    if (apiKey) {
      const readmeContent = await generateReadme(analysis, apiKey);
      return res.json({ readme: readmeContent, mode: 'advanced' });
    } else {
      const readmeContent = generateFallbackReadme(analysis);
      return res.json({ readme: readmeContent, mode: 'basic' });
    }
  } catch (err) {
    console.error('Readme endpoint error:', err.message);
    res.status(500).json({ error: 'Failed to generate README' });
  }
});

module.exports = router;
