import { convertFileSrc } from "@tauri-apps/api/core";
import { exists, mkdir, BaseDirectory, writeFile } from "@tauri-apps/plugin-fs";
import { join, appCacheDir, appLocalDataDir } from "@tauri-apps/api/path";

export const getCacheImage = async (
  url: string,
  saveCache = false,
  flushCache = false
) => {
  if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM !== "mobile") {
    return url;
  }

  const target = url.split("://");
  target[1] = target[1].replace(/[:?&]/g, "_");
  const pathParts = target[1].split("/");
  const fileName = pathParts[pathParts.length - 1];

  const cacheDir = await appCacheDir();

  const filePath = await join(
    cacheDir,
    String(BaseDirectory.AppCache),
    `${pathParts.slice(0, -1).join("_")}${fileName}`
  );

  if (
    (await exists(filePath, { baseDir: BaseDirectory.AppCache })) &&
    !flushCache
  ) {
    return convertFileSrc(filePath);
  } else {
    if (saveCache) {
      try {
        await mkdir(`${BaseDirectory.AppCache}`, {
          baseDir: BaseDirectory.AppCache,
          recursive: true,
        });
      } catch (error) {
        console.error("Error creating directory", error);
      }

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        await writeFile(filePath, new Uint8Array(buffer), {
          baseDir: BaseDirectory.Cache,
        });

        return convertFileSrc(filePath);
      } catch (error) {
        console.error("Error writing file", error);
        return url;
      }
    } else {
      return url;
    }
  }
};

export const getLocalImage = async (
  type: string,
  seriesId: number,
  fileId?: number,
  server?: string
) => {
  const localDataDir = await appLocalDataDir();
  const safeServer = server ? server.replace(/[/:?&]/g, "_") : "default";

  try {
    if (type === "book") {
      const imagePath = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "books",
        `${seriesId}`,
        "files",
        "cover.webp"
      );

      if (await exists(imagePath, { baseDir: BaseDirectory.AppLocalData })) {
        return convertFileSrc(imagePath);
      } else {
        return null;
      }
    } else if (type === "manga") {
      const imagePath = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "series",
        String(seriesId),
        "cover.webp"
      );

      if (await exists(imagePath, { baseDir: BaseDirectory.AppLocalData })) {
        return convertFileSrc(imagePath);
      } else {
        return null;
      }
    } else {
      const imagePath = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "series",
        String(seriesId),
        "files",
        `${fileId}.jpg`
      );

      if (await exists(imagePath, { baseDir: BaseDirectory.AppLocalData })) {
        return convertFileSrc(imagePath);
      } else {
        return null;
      }
    }
  } catch (error) {
    console.error("Error creating directory", error);
    return null;
  }
};
