import { useEffect, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { Book } from "./useBook";
import { useLibrary } from "./useLibrary";
import { Series } from "./useManga";
import { imageCache } from "../lib/imageCache";
import { useCommonStore } from "../store/common";

export function useLibraryImagePreloader() {
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { library } = useLibrary();

  const preloadLibraryImages = useCallback(
    async (items: (Book | Series)[], libraryId: number) => {
      if (!server || !libraryId) return;
      
      // Skip preloading for local libraries
      if (libraryId === 9999 || libraryId === 9998) return;

      // Generate URLs and cache keys for preloading
      const urls: string[] = [];
      const cacheKeys: string[] = [];

      items.forEach((item) => {
        const url = `${server}/cover-image/${libraryId}/${item.id}.webp`;
        const cacheKey = imageCache.generateCacheKey(
          item.id, 
          library?.type || 'book', 
          libraryId
        );
        
        // Only preload if not already cached
        if (!imageCache.getCachedImage(cacheKey)) {
          urls.push(url);
          cacheKeys.push(cacheKey);
        }
      });

      if (urls.length > 0) {
        // Use the cache manager's preload functionality
        await imageCache.preloadImages(urls, cacheKeys, {
          batchSize: 8,
          delayMs: 200
        });
      }
    },
    [server, library?.type]
  );

  useEffect(() => {
    if (!library || !library.series || library.series.length === 0) return;

    // Delay preloading to avoid interfering with immediate image loads
    const delayedPreload = setTimeout(() => {
      preloadLibraryImages(library.series, library.id);
    }, 2000);

    return () => {
      clearTimeout(delayedPreload);
    };
  }, [library, preloadLibraryImages]);

  return {
    preloadLibraryImages,
    getCacheStats: () => imageCache.getCacheStats(),
    clearCache: () => imageCache.clearCache(),
  };
}