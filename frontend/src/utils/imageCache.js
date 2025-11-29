// Image caching utility for better performance
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = new Set();
  }

  // Check if image is cached
  isCached(url) {
    return this.cache.has(url);
  }

  // Get cached image
  getCached(url) {
    return this.cache.get(url);
  }

  // Preload and cache image
  preload(url) {
    if (!url || this.cache.has(url) || this.preloadQueue.has(url)) {
      return Promise.resolve();
    }

    this.preloadQueue.add(url);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, {
          loaded: true,
          element: img,
          timestamp: Date.now()
        });
        this.preloadQueue.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        this.preloadQueue.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  // Preload multiple images
  async preloadBatch(urls) {
    const validUrls = urls.filter(url => url && typeof url === 'string');
    const promises = validUrls.map(url => this.preload(url).catch(err => console.warn(err)));
    return Promise.allSettled(promises);
  }

  // Clear old cached images (older than 30 minutes)
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [url, data] of this.cache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.cache.delete(url);
      }
    }
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.preloadQueue.clear();
  }
}

// Create singleton instance
const imageCache = new ImageCache();

// Cleanup every 5 minutes
setInterval(() => {
  imageCache.cleanup();
}, 5 * 60 * 1000);

export default imageCache;