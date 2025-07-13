import { useEffect, useRef, useCallback } from "react";

import { Book } from "./useBook";
import { Series } from "./useManga";

interface ImagePreloaderOptions {
  items: (Book | Series)[];
  server: string;
  libraryId: number;
  startIndex?: number;
  endIndex?: number;
  offline?: boolean;
}

export function useImagePreloader({
  items,
  server,
  libraryId,
  startIndex = 0,
  endIndex,
  offline = false,
}: ImagePreloaderOptions) {
  const preloadedImages = useRef<Set<string>>(new Set());
  const preloadQueue = useRef<{ img: HTMLImageElement; url: string }[]>([]);
  const idleCallbackId = useRef<number | null>(null);

  const preloadImage = useCallback(
    (imageUrl: string, priority: "high" | "medium" | "low" = "medium") => {
      if (preloadedImages.current.has(imageUrl)) return;

      preloadedImages.current.add(imageUrl);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";

      const queueItem = { img, url: imageUrl };

      img.onload = () => {
        const queueIndex = preloadQueue.current.findIndex(
          (item) => item.url === imageUrl
        );

        if (queueIndex > -1) {
          preloadQueue.current.splice(queueIndex, 1);
        }

        img.onload = null;
        img.onerror = null;
      };

      img.onerror = () => {
        preloadedImages.current.delete(imageUrl);

        const queueIndex = preloadQueue.current.findIndex(
          (item) => item.url === imageUrl
        );

        if (queueIndex > -1) {
          preloadQueue.current.splice(queueIndex, 1);
        }

        img.onload = null;
        img.onerror = null;
      };

      preloadQueue.current.push(queueItem);

      if (priority === "high") {
        img.src = imageUrl;
      } else {
        const loadWhenIdle = () => {
          if ("requestIdleCallback" in window) {
            idleCallbackId.current = requestIdleCallback(
              () => {
                img.src = imageUrl;
              },
              { timeout: priority === "medium" ? 1000 : 5000 }
            );
          } else {
            setTimeout(
              () => {
                img.src = imageUrl;
              },
              priority === "medium" ? 100 : 500
            );
          }
        };
        loadWhenIdle();
      }
    },
    []
  );

  useEffect(() => {
    if (offline || !server || !libraryId) return;

    const end = endIndex || items.length;
    const visibleItems = items.slice(startIndex, end);

    if (idleCallbackId.current) {
      cancelIdleCallback(idleCallbackId.current);
    }

    preloadQueue.current.forEach((item) => {
      item.img.src = "";
      item.img.onload = null;
      item.img.onerror = null;
    });
    preloadQueue.current = [];

    visibleItems.forEach((item) => {
      const imageUrl = `${server}/cover-image/${libraryId}/${item.id}.webp`;
      preloadImage(imageUrl, "high");
    });

    const expandedStart = Math.max(0, startIndex - 20);
    const expandedEnd = Math.min(items.length, end + 20);
    const nearbyItems = items.slice(expandedStart, expandedEnd);

    nearbyItems.forEach((item) => {
      const imageUrl = `${server}/cover-image/${libraryId}/${item.id}.webp`;
      if (!preloadedImages.current.has(imageUrl)) {
        preloadImage(imageUrl, "medium");
      }
    });

    return () => {
      if (idleCallbackId.current) {
        cancelIdleCallback(idleCallbackId.current);
      }
      preloadQueue.current.forEach((item) => {
        item.img.src = "";
        item.img.onload = null;
        item.img.onerror = null;
      });
      preloadQueue.current = [];
    };
  }, [items, server, libraryId, startIndex, endIndex, offline, preloadImage]);

  return {
    preloadedCount: preloadedImages.current.size,
    isPreloading: preloadQueue.current.length > 0,
  };
}
