const NodeCache = require('node-cache');
const { createClient } = require('redis');

let redisClient = null;
let nodeCache = null;
let usingRedis = false;

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || 'redis';
  const port = process.env.REDIS_PORT || '6379';
  return `redis://${host}:${port}`;
};

const initRedis = async () => {
  try {
    const url = getRedisUrl();
    redisClient = createClient({ url, socket: { reconnectStrategy: () => 1000 } });
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err?.message || err);
    });
    await redisClient.connect();
    usingRedis = true;
    console.log('✅ Connected to Redis cache:', url);
  } catch (error) {
    usingRedis = false;
    console.warn('⚠️  Redis cache not available. Falling back to NodeCache. Error:', error?.message || error);
    // fallback to NodeCache
    if (!nodeCache) nodeCache = new NodeCache({ stdTTL: Number(process.env.TIMESERIES_CACHE_TTL) || 300 });
  }
};

const initCache = async () => {
  if (process.env.USE_REDIS === 'true' || process.env.REDIS_URL || process.env.REDIS_HOST) {
    await initRedis();
  } else {
    nodeCache = new NodeCache({ stdTTL: Number(process.env.TIMESERIES_CACHE_TTL) || 300 });
    usingRedis = false;
    console.log('ℹ️ NodeCache initialized as fallback');
  }
};

const get = async (key) => {
  if (usingRedis && redisClient) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      console.warn('Redis get error for key', key, err?.message || err);
      return null;
    }
  }
  if (!nodeCache) nodeCache = new NodeCache({ stdTTL: Number(process.env.TIMESERIES_CACHE_TTL) || 300 });
  return nodeCache.get(key) || null;
};

const set = async (key, value, ttlSeconds) => {
  if (usingRedis && redisClient) {
    try {
      if (ttlSeconds) await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      else await redisClient.set(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('Redis set error for key', key, err?.message || err);
      return false;
    }
  }
  if (!nodeCache) nodeCache = new NodeCache({ stdTTL: Number(process.env.TIMESERIES_CACHE_TTL) || 300 });
  return nodeCache.set(key, value, ttlSeconds);
};

const del = async (key) => {
  if (usingRedis && redisClient) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.warn('Redis del error for key', key, err?.message || err);
      return false;
    }
  }
  if (!nodeCache) nodeCache = new NodeCache({ stdTTL: Number(process.env.TIMESERIES_CACHE_TTL) || 300 });
  return nodeCache.del(key);
};

const delPattern = async (pattern) => {
  // Support simple patterns like 'prefix*'
  if (usingRedis && redisClient) {
    try {
      const stream = redisClient.scanIterator({ MATCH: pattern, COUNT: 100 });
      const keysToDelete = [];
      for await (const k of stream) {
        keysToDelete.push(k);
      }
      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
      }
      return true;
    } catch (err) {
      console.warn('Redis delPattern error for pattern', pattern, err?.message || err);
      return false;
    }
  }

  if (!nodeCache) nodeCache = new NodeCache({ stdTTL: Number(process.env.TIMESERIES_CACHE_TTL) || 300 });
  try {
    const keys = nodeCache.keys();
    const matching = keys.filter(k => k && (pattern.endsWith('*') ? k.startsWith(pattern.replace('*', '')) : k === pattern));
    if (matching.length > 0) nodeCache.del(matching);
    return true;
  } catch (err) {
    console.warn('NodeCache delPattern error for pattern', pattern, err?.message || err);
    return false;
  }
};

module.exports = {
  initCache,
  get,
  set,
  del,
  delPattern,
  _internal: {
    get redisClient() { return redisClient; },
    get nodeCache() { return nodeCache; },
    get usingRedis() { return usingRedis; }
  }
};
