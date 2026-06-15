const express = require('express');
const router = express.Router();
const mockAnalysis = require('../../data/mockAnalysis.json');

const { fetchAllFiles } = require('../services/github');
const { analyzeRepo } = require('../services/parser');
const cache = require('../services/cache');

router.get('/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const force = req.query.force === 'true';
  const cacheKey = `${owner}/${repo}`;
  
  // Return mock data for the specific realworld example if requested (for frontend dev)
  if (owner === 'gothinkster' && repo === 'node-express-realworld-example-app' && !force) {
    return res.json(mockAnalysis);
  }

  try {
    if (!force && cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    // 1. Fetch files from GitHub
    const { meta, files } = await fetchAllFiles(owner, repo);
    
    // 2. Parse and analyze
    const analysis = await analyzeRepo(owner, repo, files, meta);
    
    // 3. Cache and return
    cache.set(cacheKey, analysis);
    res.json(analysis);
    
  } catch (error) {
    console.error(`Analyze error for ${owner}/${repo}:`, error.message);
    
    // If it's a 404 from GitHub
    if (error.status === 404) {
      return res.status(404).json({ error: 'Repository not found or is private' });
    }
    
    // Rate limit
    if (error.status === 403 || error.status === 429) {
      return res.status(429).json({ error: 'GitHub API rate limit exceeded' });
    }
    
    res.status(500).json({ error: 'Failed to analyze repository' });
  }
});

module.exports = router;
