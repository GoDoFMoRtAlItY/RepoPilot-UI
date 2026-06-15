const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const { fetchAllFiles } = require('../services/github');
const { analyzeRepo } = require('../services/parser');

router.post('/pr-opened', async (req, res) => {
  try {
    const { repository, pull_request } = req.body;
    
    if (!repository || !pull_request) {
      return res.status(400).json({ error: 'Missing repository or pull_request payload' });
    }

    const owner = repository.owner.login;
    const repo = repository.name;
    const cacheKey = `${owner}/${repo}`;

    console.log(`Received PR webhook for ${owner}/${repo} PR #${pull_request.number}`);

    // Re-analyze with force refresh
    const { meta, files } = await fetchAllFiles(owner, repo);
    const newAnalysis = await analyzeRepo(owner, repo, files, meta);
    
    // Get previous analysis from cache (if it exists) to compute diff
    const oldAnalysis = cache.get(cacheKey); 
    
    // Update cache with new analysis
    cache.set(cacheKey, newAnalysis);

    // Compute diff
    const routesDiff = newAnalysis.routes.length - (oldAnalysis?.routes?.length || 0);
    const envVarsDiff = newAnalysis.envVars.length - (oldAnalysis?.envVars?.length || 0);
    const apisDiff = newAnalysis.apis.length - (oldAnalysis?.apis?.length || 0);
    const scoreDiff = newAnalysis.onboardingScore.score - (oldAnalysis?.onboardingScore?.score || 0);
    const alertsDiff = newAnalysis.securityAlerts.length - (oldAnalysis?.securityAlerts?.length || 0);

    const diff = {
      repo: `${owner}/${repo}`,
      pr: pull_request.number,
      prTitle: pull_request.title,
      changes: {
        routesAdded: routesDiff,
        envVarsAdded: envVarsDiff,
        apisAdded: apisDiff,
        scoreChange: scoreDiff,
        newSecurityAlerts: alertsDiff,
      },
      summary: `PR #${pull_request.number} "${pull_request.title}": ` +
        `${newAnalysis.routes.length} total routes (${routesDiff > 0 ? '+' : ''}${routesDiff}), ` +
        `${newAnalysis.envVars.length} env vars (${envVarsDiff > 0 ? '+' : ''}${envVarsDiff}), ` +
        `score: ${newAnalysis.onboardingScore.score}/100 (${scoreDiff > 0 ? '+' : ''}${scoreDiff})`
    };
    
    res.json(diff);
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router;
