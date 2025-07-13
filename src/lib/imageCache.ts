interface CacheEntry {
  url: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface LoadingState {
  promise: Promise<string | null>;
  abortController: AbortController;
}

export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache = new Map<string, CacheEntry>();
  private loadingStates = new Map<string, LoadingState>();
  private imagePool = new Set<HTMLImageElement>();
  private maxCacheSize = 500;
  private maxImagePoolSize = 50;

  private constructor() {
    // Cleanup cache periodically
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  generateCacheKey(
    entityId: number,
    type: "book" | "manga" | "file",
    libraryId?: number
  ): string {
    return `${type}-${entityId}-${libraryId || "local"}`;
  }

  getCachedImage(cacheKey: string): string | null {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      return entry.url;
    }
    return null;
  }

  private getOrCreateImage(): HTMLImageElement {
    if (this.imagePool.size > 0) {
      const img = this.imagePool.values().next().value as HTMLImageElement;
      this.imagePool.delete(img);
      return img;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    return img;
  }

  private returnImageToPool(img: HTMLImageElement): void {
    if (this.imagePool.size < this.maxImagePoolSize) {
      // Reset image state
      img.src = "";
      img.onload = null;
      img.onerror = null;
      this.imagePool.add(img);
    }
  }

  async loadImage(
    url: string,
    cacheKey: string,
    options: { timeout?: number; priority?: "high" | "low" } = {}
  ): Promise<string | null> {
    // Check cache first
    const cached = this.getCachedImage(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const existingLoad = this.loadingStates.get(cacheKey);
    if (existingLoad) {
      return existingLoad.promise;
    }

    // Start new load
    const abortController = new AbortController();
    const loadPromise = this.performImageLoad(
      url,
      cacheKey,
      abortController,
      options
    );

    this.loadingStates.set(cacheKey, { promise: loadPromise, abortController });

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingStates.delete(cacheKey);
    }
  }

  private async performImageLoad(
    url: string,
    cacheKey: string,
    abortController: AbortController,
    options: { timeout?: number; priority?: "high" | "low" }
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const img = this.getOrCreateImage();
      const timeout = options.timeout || 10000;

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.returnImageToPool(img);
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);

      img.onload = () => {
        // Cache the successful URL
        this.setCacheEntry(cacheKey, url);
        cleanup();
        resolve(url);
      };

      img.onerror = () => {
        cleanup();
        resolve(null);
      };

      // Handle abort
      abortController.signal.addEventListener("abort", () => {
        cleanup();
        resolve(null);
      });

      // Set priority if supported
      if ("fetchPriority" in img && options.priority) {
        (img as any).fetchPriority = options.priority;
      }

      img.src = url;
    });
  }

  setCacheEntry(cacheKey: string, url: string): void {
    // Ensure cache doesn't exceed size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache.set(cacheKey, {
      url,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  private evictLeastUsed(): void {
    let leastUsedKey = "";
    let leastUsedScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score based on access count and recency (lower is worse)
      const ageBonus = Math.max(0, Date.now() - entry.lastAccessed) / 1000; // Age in seconds
      const score = entry.accessCount - ageBonus / 3600; // Reduce score by 1 per hour of age

      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  cancelLoad(cacheKey: string): void {
    const loadingState = this.loadingStates.get(cacheKey);
    if (loadingState) {
      loadingState.abortController.abort();
      this.loadingStates.delete(cacheKey);
    }
  }

  clearCache(): void {
    this.cache.clear();

    // @ts-ignore
    for (const [key, loadingState] of this.loadingStates.entries()) {
      loadingState.abortController.abort();
    }
    this.loadingStates.clear();
  }

  getCacheStats(): { size: number; loadingCount: number; poolSize: number } {
    return {
      size: this.cache.size,
      loadingCount: this.loadingStates.size,
      poolSize: this.imagePool.size,
    };
  }

  // Preload images for library
  async preloadImages(
    urls: string[],
    cacheKeys: string[],
    options: { batchSize?: number; delayMs?: number } = {}
  ): Promise<void> {
    const { batchSize = 10, delayMs = 100 } = options;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchKeys = cacheKeys.slice(i, i + batchSize);

      // Load batch in parallel
      const batchPromises = batch.map((url, idx) =>
        this.loadImage(url, batchKeys[idx], { priority: "low", timeout: 5000 })
      );

      await Promise.allSettled(batchPromises);

      // Delay between batches to avoid overwhelming the browser
      if (i + batchSize < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}

// Export singleton instance
export const imageCache = ImageCacheManager.getInstance();
