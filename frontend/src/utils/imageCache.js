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

      // Timeout to prevent stuck loading
      const timeoutId = setTimeout(() => {
        this.preloadQueue.delete(url);
        console.warn(`Image load timed out: ${url}`);
        // Resolve successfully (with null) so the app proceeds
        resolve(null);
      }, 3000); // 3 seconds max wait time

      img.onload = () => {
        clearTimeout(timeoutId);
        this.cache.set(url, {
          loaded: true,
          element: img,
          timestamp: Date.now()
        });
        this.preloadQueue.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        this.preloadQueue.delete(url);
        // Don't fail the build/app, just warn
        console.warn(`Failed to load image: ${url}`);
        resolve(null);
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

// Cleanup every 30 minutes (reduced frequency from 5 minutes)
// Only cleanup if cache has items to reduce unnecessary processing
setInterval(() => {
  if (imageCache.size() > 0) {
    imageCache.cleanup();
  }
}, 30 * 60 * 1000); // 30 minutes = 1800000ms

export default imageCache;