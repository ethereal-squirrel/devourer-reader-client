import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { getLocalImage } from "../lib/media";
import { imageCache } from "../lib/imageCache";
import { useCommonStore } from "../store/common";
import { Book } from "./useBook";
import { File, Series } from "./useManga";

export interface UseImageLoaderOptions {
  type: "manga" | "book" | "file";
  entity: Book | Series | File;
  libraryId?: number;
  offline?: boolean;
  fallbackUrl?: string;
}

export interface UseImageLoaderResult {
  imagePath: string | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useImageLoader({
  type,
  entity,
  libraryId,
  offline = false,
  fallbackUrl,
}: UseImageLoaderOptions): UseImageLoaderResult {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const currentLoadRef = useRef<string | null>(null);

  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );

  const cacheKey = useMemo(() => {
    const entityId = offline
      ? type === "book"
        ? (entity as Book).file_id
        : (entity as Series).series_id
      : entity.id;
    return imageCache.generateCacheKey(entityId, type, libraryId);
  }, [type, entity, libraryId, offline]);

  const onlineImageUrl = useMemo(() => {
    if (!server || !libraryId || offline) return null;

    if (type === "file") {
      return `${server}/preview-image/${libraryId}/${
        (entity as File).series_id
      }/${(entity as File).id}.jpg`;
    } else {
      return `${server}/cover-image/${libraryId}/${entity.id}.webp`;
    }
  }, [server, libraryId, entity.id, offline]);

  const loadImage = useCallback(async () => {
    if (!entity || !isMountedRef.current) return;

    const entityId = offline
      ? type === "book"
        ? (entity as Book).file_id
        : (entity as Series).series_id
      : entity.id;

    if (entityId <= 0) {
      setIsLoading(false);
      setImagePath(fallbackUrl || "");
      return;
    }

    if (!offline && (!server || !libraryId)) {
      setIsLoading(true);
      return;
    }

    const cached = imageCache.getCachedImage(cacheKey);
    if (cached) {
      if (isMountedRef.current) {
        setImagePath(cached);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    currentLoadRef.current = cacheKey;

    try {
      let result: string | null = null;

      if (offline) {
        const seriesIdParam =
          type === "book"
            ? (entity as Book).file_id
            : (entity as Series).series_id;
        const fileIdParam =
          type === "manga" || type === "file"
            ? (entity as File).file_id
            : undefined;
        const serverParam = (entity as any).server;

        result = await getLocalImage(
          type,
          seriesIdParam,
          fileIdParam,
          serverParam
        );

        if (result) {
          imageCache.setCacheEntry(cacheKey, result);
        }
      } else if (onlineImageUrl) {
        result = await imageCache.loadImage(onlineImageUrl, cacheKey, {
          timeout: 10000,
          priority: "high",
        });
      }

      if (!isMountedRef.current || currentLoadRef.current !== cacheKey) {
        return;
      }

      if (result) {
        setImagePath(result);
        setIsLoading(false);
        setError(null);
      } else {
        setImagePath(fallbackUrl || "");
        setError(offline ? "Local image not found" : "Failed to load image");
        setIsLoading(false);
      }
    } catch (err) {
      if (!isMountedRef.current || currentLoadRef.current !== cacheKey) {
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to load image");
      setImagePath(fallbackUrl || "");
      setIsLoading(false);
    }
  }, [
    cacheKey,
    type,
    entity,
    offline,
    onlineImageUrl,
    fallbackUrl,
    server,
    libraryId,
  ]);

  const retry = useCallback(() => {
    if (currentLoadRef.current) {
      imageCache.cancelLoad(currentLoadRef.current);
    }
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    isMountedRef.current = true;
    loadImage();

    return () => {
      isMountedRef.current = false;

      if (currentLoadRef.current) {
        imageCache.cancelLoad(currentLoadRef.current);
      }
    };
  }, [loadImage]);


  return {
    imagePath,
    isLoading,
    error,
    retry,
  };
}

export const imageCacheUtils = {
  getCacheStats: () => imageCache.getCacheStats(),
  clearCache: () => imageCache.clearCache(),
  generateCacheKey: (
    entityId: number,
    type: "book" | "manga",
    libraryId?: number
  ) => imageCache.generateCacheKey(entityId, type, libraryId),
};
