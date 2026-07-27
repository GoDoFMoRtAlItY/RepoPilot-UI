const express = require('express');
const router = express.Router();
const ProviderManager = require('../services/ai/ProviderManager');

router.post('/test-key', async (req, res) => {
  const { provider, key } = req.body;
  
  if (!provider || !key) {
    return res.status(400).json({ error: 'Provider and key are required' });
  }

  try {
    // We do a very minimal call to test the key.
    // generateFileDescription is cheap and fast.
    const result = await ProviderManager.execute(
      'generateFileDescription',
      'test.txt',
      'const a = 1;',
      { key: key, provider: provider }
    );

    if (result.success) {
      return res.json({ valid: true });
    } else {
      return res.status(401).json({ 
        valid: false, 
        error: result.message || 'Key validation failed' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      valid: false, 
      error: 'An error occurred while testing the key' 
    });
  }
});

module.exports = router;
