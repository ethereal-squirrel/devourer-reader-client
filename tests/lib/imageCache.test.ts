import { ImageCacheManager } from '../../src/lib/imageCache';

// Mock global fetch
global.fetch = jest.fn();
global.HTMLImageElement = jest.fn(() => ({
  onload: null,
  onerror: null,
  src: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as any;

// Mock Image constructor
global.Image = HTMLImageElement as any;

describe('ImageCacheManager', () => {
  let imageCache: ImageCacheManager;

  beforeEach(() => {
    // Reset singleton instance for each test
    (ImageCacheManager as any).instance = null;
    imageCache = ImageCacheManager.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending operations
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ImageCacheManager.getInstance();
      const instance2 = ImageCacheManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate cache key for book with library ID', () => {
      const key = imageCache.generateCacheKey(123, 'book', 456);
      expect(key).toBe('book-123-456');
    });

    it('should generate cache key for manga without library ID', () => {
      const key = imageCache.generateCacheKey(789, 'manga');
      expect(key).toBe('manga-789-local');
    });

    it('should generate cache key for file with library ID', () => {
      const key = imageCache.generateCacheKey(111, 'file', 222);
      expect(key).toBe('file-111-222');
    });
  });

  describe('getCachedImage', () => {
    it('should return null for non-existent cache entry', () => {
      const result = imageCache.getCachedImage('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return cached URL and update access stats', () => {
      const cacheKey = 'test-key';
      const testUrl = 'blob:test-url';
      
      // Use setCacheEntry to set up the cache
      imageCache.setCacheEntry(cacheKey, testUrl);

      const result = imageCache.getCachedImage(cacheKey);
      expect(result).toBe(testUrl);
    });
  });

  describe('setCacheEntry', () => {
    it('should store cache entry', () => {
      const cacheKey = 'test-set-key';
      const testUrl = 'blob:test-set-url';

      imageCache.setCacheEntry(cacheKey, testUrl);

      const result = imageCache.getCachedImage(cacheKey);
      expect(result).toBe(testUrl);
    });
  });

  describe('loadImage', () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should return cached image if available', async () => {
      const cacheKey = 'cached-key';
      const cachedUrl = 'blob:cached-url';
      const sourceUrl = 'https://example.com/image.jpg';

      // Set up cache
      imageCache.setCacheEntry(cacheKey, cachedUrl);

      const result = await imageCache.loadImage(sourceUrl, cacheKey);
      expect(result).toBe(cachedUrl);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch and cache new image', async () => {
      const cacheKey = 'new-key';
      const sourceUrl = 'https://example.com/image.jpg';

      // Mock the Image constructor to immediately trigger onload
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        crossOrigin: '',
        decoding: '',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      
      (global.Image as any) = jest.fn(() => {
        const img = { ...mockImage };
        // Immediately trigger onload when src is set
        Object.defineProperty(img, 'src', {
          set: function(value) {
            this._src = value;
            if (this.onload && value) {
              // Use Promise.resolve to ensure async behavior without setTimeout
              Promise.resolve().then(() => this.onload());
            }
          },
          get: function() { return this._src; }
        });
        return img;
      });

      const result = await imageCache.loadImage(sourceUrl, cacheKey);
      
      expect(result).toBe(sourceUrl);
      expect(imageCache.getCachedImage(cacheKey)).toBe(sourceUrl);
    });

    it('should handle fetch errors gracefully', async () => {
      const cacheKey = 'error-key';
      const sourceUrl = 'https://example.com/nonexistent.jpg';

      // Mock the Image constructor to trigger onerror
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        crossOrigin: '',
        decoding: '',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      
      (global.Image as any) = jest.fn(() => {
        const img = { ...mockImage };
        // Immediately trigger onerror when src is set
        Object.defineProperty(img, 'src', {
          set: function(value) {
            this._src = value;
            if (this.onerror && value) {
              // Use Promise.resolve to ensure async behavior without setTimeout
              Promise.resolve().then(() => this.onerror());
            }
          },
          get: function() { return this._src; }
        });
        return img;
      });

      const result = await imageCache.loadImage(sourceUrl, cacheKey);
      expect(result).toBeNull();
      expect(imageCache.getCachedImage(cacheKey)).toBeNull();
    });
  });

  describe('cancelLoad', () => {
    it('should cancel ongoing load operation', () => {
      const cacheKey = 'cancel-key';

      // Mock ongoing load
      const mockAbortController = { abort: jest.fn() };
      (imageCache as any).loadingStates.set(cacheKey, {
        promise: Promise.resolve(null),
        abortController: mockAbortController,
      });

      imageCache.cancelLoad(cacheKey);

      expect(mockAbortController.abort).toHaveBeenCalled();
      expect((imageCache as any).loadingStates.has(cacheKey)).toBe(false);
    });

    it('should handle canceling non-existent load', () => {
      expect(() => {
        imageCache.cancelLoad('non-existent-key');
      }).not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', () => {
      // Add some entries
      imageCache.setCacheEntry('key1', 'url1');
      imageCache.setCacheEntry('key2', 'url2');

      const stats = imageCache.getCacheStats();

      expect(stats).toEqual({
        size: 2,
        loadingCount: 0,
        poolSize: 0,
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', () => {
      imageCache.setCacheEntry('key1', 'url1');
      imageCache.setCacheEntry('key2', 'url2');

      imageCache.clearCache();

      expect(imageCache.getCacheStats().size).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle null cacheKey gracefully', () => {
      expect(() => {
        imageCache.getCachedImage(null as any);
      }).not.toThrow();
    });

    it('should handle undefined cacheKey gracefully', () => {
      expect(() => {
        imageCache.getCachedImage(undefined as any);
      }).not.toThrow();
    });

    it('should handle empty string cacheKey', () => {
      const result = imageCache.getCachedImage('');
      expect(result).toBeNull();
    });
  });
});