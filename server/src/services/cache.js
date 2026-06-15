const { LRUCache } = require('lru-cache');

// 50 items, 1 hour TTL
const cache = new LRUCache({
  max: 50,
  ttl: 1000 * 60 * 60, // 1 hour in ms
});

module.exports = cache;
