const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { generateReadme, generateFallbackReadme } = require('../services/aiReadme');

router.post('/', async (req, res) => {
  try {
    const { owner, repo, analysis: bodyAnalysis } = req.body;
    const apiKey = req.headers['x-ai-key'];
    
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Missing owner or repo' });
    }

    // Get cached analysis for this repo or fallback to body analysis or search cache
    const cacheKey = `${owner}/${repo}`;
    let analysis = bodyAnalysis || cache.get(cacheKey);
    
    if (!analysis) {
      for (const k of cache.keys()) {
        if (k.startsWith(`${owner}/${repo}`)) {
          analysis = cache.get(k);
          break;
        }
      }
    }

    if (!analysis) {
      return res.status(404).json({ error: 'Repo not analyzed yet. Please click "ANALYZE" first.' });
    }
    
    // Call AI or fallback
    try {
      const readmeContent = await generateReadme(analysis, apiKey);
      return res.json({ readme: readmeContent, mode: 'completed' });
    } catch (aiErr) {
      console.warn('AI README generation failed, using structured fallback:', aiErr.message);
      const readmeContent = generateFallbackReadme(analysis);
      return res.json({ readme: readmeContent, mode: 'basic' });
    }
  } catch (err) {
    console.error('Readme endpoint error:', err.message);
    try {
      const fallback = generateFallbackReadme(req.body.analysis || {});
      return res.json({ readme: fallback, mode: 'fallback' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to generate README' });
    }
  }
});

module.exports = router;
