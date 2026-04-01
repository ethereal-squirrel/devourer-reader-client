import { useEffect, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { Book } from "./useBook";
import { useLibrary } from "./useLibrary";
import { Series } from "./useManga";
import { imageCache } from "../lib/imageCache";
import { useCommonStore } from "../store/common";
import { AudiobookSeries } from "./useAudiobook";

export function useLibraryImagePreloader() {
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    })),
  );
  const { library } = useLibrary();

  const preloadLibraryImages = useCallback(
    async (items: (Book | Series | AudiobookSeries)[], libraryId: number) => {
      if (!server || !libraryId) return;

      if (libraryId === 9999 || libraryId === 9998) return;

      const urls: string[] = [];
      const cacheKeys: string[] = [];

      items.forEach((item) => {
        const url = `${server}/cover-image/${libraryId}/${item.id}.jpg`;
        const cacheKey = imageCache.generateCacheKey(
          item.id,
          library?.type || "book",
          libraryId,
        );

        if (!imageCache.getCachedImage(cacheKey)) {
          urls.push(url);
          cacheKeys.push(cacheKey);
        }
      });

      if (urls.length > 0) {
        await imageCache.preloadImages(urls, cacheKeys, {
          batchSize: 8,
          delayMs: 200,
        });
      }
    },
    [server, library?.type],
  );

  useEffect(() => {
    if (!library || !library.series || library.series.length === 0) return;

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
