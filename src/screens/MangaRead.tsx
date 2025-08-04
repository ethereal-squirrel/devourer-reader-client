import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { join } from "@tauri-apps/api/path";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { BaseDirectory, mkdir, remove } from "@tauri-apps/plugin-fs";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { createExtractorFromData } from "node-unrar-js";
import {
  ArrowLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  DocumentIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassPlusIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";

import { db } from "../lib/database";
import { useCommonStore } from "../store/common";
import { useUIStore } from "../store/ui";
import { File, useManga } from "../hooks/useManga";
import { useShared } from "../hooks/useShared";
import { useLibraryStore } from "../store/library";
import { Library } from "../hooks/useLibrary";

export default function MangaReadScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLocal = searchParams.get("isLocal") === "true";
  const localServer = searchParams.get("server");
  const directOpen = searchParams.get("directOpen") === "true";
  const directFile = searchParams.get("directFile");
  const { retrieveFile, retrieveLocalFile } = useManga();
  const { pageEvent } = useShared();
  const isLoading = useRef<boolean>(false);
  const navigate = useNavigate();
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { libraryData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData,
    }))
  );
  const {
    mangaDirection,
    mangaViewMode,
    mangaFitMode,
    setMangaDirection,
    setMangaViewMode,
    setMangaFitMode,
  } = useUIStore(
    useShallow((state) => ({
      mangaDirection: state.mangaDirection,
      mangaViewMode: state.mangaViewMode,
      mangaFitMode: state.mangaFitMode,
      setMangaDirection: state.setMangaDirection,
      setMangaViewMode: state.setMangaViewMode,
      setMangaFitMode: state.setMangaFitMode,
    }))
  );

  const [displaySettings, setDisplaySettings] = useState<boolean>(false);
  const [manga, setManga] = useState<File | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<string[]>([]);
  const [isGrayscale, setIsGrayscale] = useState<boolean>(false);

  const getNextFile = async (fileId: number) => {
    let url: string | null = null;

    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "web") {
      pages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    }

    if (isLocal) {
      url = `/manga/read-bounce?isLocal=true&server=${localServer}&fileId=${fileId}`;
    } else {
      url = `/manga/read-bounce?fileId=${fileId}`;
    }

    navigate(url, { replace: true, state: { key: Date.now() } });
  };

  const getManga = useCallback(
    async (nextId?: number) => {
      if (!id) {
        return null;
      }

      if (isLoading.current) {
        return;
      }

      isLoading.current = true;

      let mangaEntity: File | null = null;

      if (isLocal) {
        mangaEntity = await retrieveLocalFile(
          nextId || Number(id),
          localServer || ""
        );

        if (
          (mangaEntity as any).current_page &&
          (mangaEntity as any).current_page !== 0
        ) {
          setPage(Number((mangaEntity as any).current_page));
        }

        if (!mangaEntity) {
          throwLoadError("Manga not found.");
          return false;
        }

        setManga(mangaEntity);
        await extractLocalManga(mangaEntity, localServer || "");
      } else {
        if (directOpen && directFile) {
          if (directFile.endsWith(".zip") || directFile.endsWith(".cbz")) {
            await unzipManga(directFile, "zip");
          } else if (
            directFile.endsWith(".rar") ||
            directFile.endsWith(".cbr")
          ) {
            await unzipManga(directFile, "rar");
          }
        } else {
          mangaEntity = await retrieveFile(nextId || Number(id));
          console.log("Manga Entity", mangaEntity);

          if (!mangaEntity) {
            throwLoadError("Manga not found.");
            return false;
          }

          setManga(mangaEntity);

          if (
            (mangaEntity as any).current_page &&
            (mangaEntity as any).current_page !== 0
          ) {
            setPage(Number((mangaEntity as any).current_page));
          }

          await downloadManga(mangaEntity, server);
        }
      }
    },
    [
      id,
      isLocal,
      localServer,
      directOpen,
      directFile,
      retrieveLocalFile,
      retrieveFile,
      server,
      libraryData,
    ]
  );

  const extractLocalManga = async (manga: File, server: string) => {
    const safeServer = server.replace(/[/:?&]/g, "_") || "";
    const localDataDir = await appLocalDataDir();

    const path = await join(
      localDataDir,
      String(BaseDirectory.AppLocalData),
      safeServer,
      "series",
      String(manga.series_id),
      "files",
      manga.file_name
    );

    if (manga.file_format === "zip" || manga.file_format === "cbz") {
      await unzipManga(path, "zip");
    } else if (manga.file_format === "rar" || manga.file_format === "cbr") {
      await unzipManga(path, "rar");
    }
  };

  const downloadManga = async (manga: File, server: null | string) => {
    if (!isLocal) {
      if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "web") {
        const response = await fetch(
          `${server}/stream/${(libraryData as unknown as Library)?.id}/${
            manga.id
          }`
        );
        const arrayBuffer = await response.arrayBuffer();

        if (manga.file_format === "zip" || manga.file_format === "cbz") {
          const zip = new JSZip();
          const contents = await zip.loadAsync(arrayBuffer);
          const files = Object.keys(contents.files);
          files.sort((a, b) => a.localeCompare(b));
          const imageUrls = await Promise.all(
            files.map(async (filename) => {
              const file = contents.files[filename];
              const blob = await file.async("blob");
              return URL.createObjectURL(blob);
            })
          );

          setPages(imageUrls);
        } else if (manga.file_format === "rar" || manga.file_format === "cbr") {
          try {
            const wasmPath =
              import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "web"
                ? "/client/unrar.wasm"
                : "/unrar.wasm";
            const wasmBinary = await fetch(wasmPath).then((r) =>
              r.arrayBuffer()
            );

            const extractor = await createExtractorFromData({
              data: new Uint8Array(arrayBuffer),
              wasmBinary: wasmBinary,
            });

            const fileList = extractor.getFileList();
            const allFiles = Array.from(fileList.fileHeaders);
            const imageFiles = allFiles
              .filter(
                (file: any) =>
                  !file.flags.directory &&
                  /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name)
              )
              .sort((a: any, b: any) =>
                a.name.localeCompare(b.name, undefined, { numeric: true })
              );

            const imageUrls = [];
            for (const file of imageFiles) {
              const extracted = extractor.extract({ files: [file.name] });
              const extractedFiles = Array.from(extracted.files);
              const fileData = extractedFiles[0].extraction;

              if (fileData) {
                const blob = new Blob([fileData]);
                imageUrls.push(URL.createObjectURL(blob));
              }
            }

            setPages(imageUrls);
          } catch (error) {
            console.error("RAR extraction failed:", error);
            throwLoadError("Failed to extract RAR archive.");
          }
        }
      } else {
        console.log("Checking for offline availability.");

        const results = await db.select(
          "SELECT * FROM MangaFile WHERE file_id = ? AND server = ?",
          [manga.id, server]
        );

        if (results && results.length > 0) {
          console.log("Manga is available offline.");

          await extractLocalManga(manga, server || "");
        } else {
          console.log(
            "Manga is not available offline, attempting to download from remote source."
          );

          let fileName: string | null = null;
          let fileFormat: string | null = null;

          if (manga.file_format === "zip" || manga.file_format === "cbz") {
            fileName = "current.zip";
            fileFormat = "zip";
          } else if (
            manga.file_format === "rar" ||
            manga.file_format === "cbr"
          ) {
            fileName = "current.rar";
            fileFormat = "rar";
          }

          if (!fileName) {
            throwLoadError("Unknown file format.");
            return;
          }

          const localDataDir = await appLocalDataDir();
          const path = await join(
            localDataDir,
            String(BaseDirectory.AppLocalData),
            fileName
          );

          const url = `${server}/stream/${
            (libraryData as unknown as Library)?.id
          }/${manga.id}`;
          console.log("Attempting to download manga from:", url, "to:", path);

          try {
            await mkdir(`${BaseDirectory.AppLocalData}`, {
              baseDir: BaseDirectory.AppLocalData,
              recursive: true,
            });
          } catch (error) {
            console.error("Error creating directory", error);
          }

          try {
            await remove(path);
          } catch (error) {
            console.error("Error removing file", error);
          }

          try {
            await invoke("download_file", {
              url,
              path,
            });

            console.log("Manga downloaded successfully.");

            await new Promise((resolve) => setTimeout(resolve, 50));
            await unzipManga(path, fileFormat || "");
          } catch (error) {
            console.error("invoke", error);
            throwLoadError("Failed to download manga.");
          }
        }
      }
    }
  };

  const unzipManga = async (path: string, format: string) => {
    const localDataDir = await appLocalDataDir();
    const currentlyReadingDir = `${BaseDirectory.AppLocalData}/currentlyReading`;

    try {
      await remove(currentlyReadingDir, {
        baseDir: BaseDirectory.AppLocalData,
        recursive: true,
      });
    } catch (error) {
      console.error("Error removing directory", error);
    }

    try {
      await mkdir(currentlyReadingDir, {
        baseDir: BaseDirectory.AppLocalData,
        recursive: true,
      });
    } catch (error) {
      console.error("Error creating directory", error);
    }

    const archivePath = await join(
      localDataDir,
      String(BaseDirectory.AppLocalData),
      "currentlyReading"
    );

    if (format === "zip") {
      await invoke("unzip_file", {
        path,
        destination: archivePath,
      });
    } else if (format === "rar") {
      await invoke("unrar_file", {
        path,
        destination: archivePath,
      });
    }

    console.log("File unzipped successfully.");

    await new Promise((resolve) => setTimeout(resolve, 50));

    const files = (await invoke("get_files_in_directory", {
      path: archivePath,
    })) as string[];

    files.sort((a, b) => a.localeCompare(b));

    const filesArray = await Promise.all(
      files.map(async (filename) => {
        const pathComponents = filename.split(/[\/\\]/);
        const file = await join(archivePath, ...pathComponents);
        const converted = convertFileSrc(file);
        const cacheBuster = Date.now();
        const urlWithCacheBuster = `${converted}?t=${cacheBuster}`;

        return urlWithCacheBuster;
      })
    );

    setPages(filesArray);
  };

  const goForward = useCallback(async () => {
    let jump = 1;

    if (mangaViewMode === "double") {
      jump = 2;
    }

    let targetPage = page + jump;

    if (targetPage >= pages.length) {
      targetPage = pages.length;
    }

    if (!directOpen) {
      pageEvent(
        targetPage,
        isLocal,
        (libraryData as unknown as Library)?.id || 0,
        isLocal ? manga?.file_id || 0 : manga?.id || 0,
        localServer || ""
      );
    }

    setPage(targetPage);
  }, [
    mangaViewMode,
    page,
    pages.length,
    directOpen,
    pageEvent,
    isLocal,
    libraryData,
    manga?.file_id,
    manga?.id,
    localServer,
  ]);

  const goBack = useCallback(async () => {
    let jump = 1;

    if (mangaViewMode === "double") {
      jump = 2;
    }

    let targetPage = page - jump;

    if (targetPage <= 0) {
      targetPage = 1;
    }

    if (!directOpen) {
      pageEvent(
        targetPage,
        isLocal,
        (libraryData as unknown as Library)?.id || 0,
        isLocal ? manga?.file_id || 0 : manga?.id || 0,
        localServer || ""
      );
    }

    setPage(targetPage);
  }, [
    mangaViewMode,
    page,
    directOpen,
    pageEvent,
    isLocal,
    libraryData,
    manga?.file_id,
    manga?.id,
    localServer,
  ]);

  const throwLoadError = (message: string) => {
    toast.error(message, {
      position: "bottom-right",
      style: {
        backgroundColor: "#111827",
        color: "#fff",
      },
    });

    console.error("Error loading file, please try again.");
    navigate("/");
  };

  useEffect(() => {
    return () => {
      if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM !== "web") {
        return;
      }

      pages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (pages.length > 0) {
      return;
    }

    if (!isLocal && !libraryData && !directOpen && !directFile) {
      return;
    }

    if (!directOpen && (!server || manga)) {
      return;
    }

    if (id || (directOpen && directFile)) {
      getManga();
    }
  }, [
    id,
    getManga,
    server,
    libraryData,
    isLocal,
    pages,
    directOpen,
    directFile,
  ]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        if (mangaDirection === "ltr") {
          goBack();
        } else {
          goForward();
        }
      } else if (event.key === "ArrowRight") {
        if (mangaDirection === "ltr") {
          goForward();
        } else {
          goBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [mangaDirection, goForward, goBack]);

  useEffect(() => {
    const titlebar = document.querySelector(".titlebar");

    if (titlebar) {
      (titlebar as any).style.display = "none";
    }
  }, []);

  const renderButton = (icon: React.ReactNode, onClick: () => void) => {
    return (
      <button
        className="bg-primary text-white rounded-full p-2 hover:bg-tertiary hover:cursor-pointer"
        onClick={onClick}
        style={{ zIndex: 2000 }}
      >
        {icon}
      </button>
    );
  };

  const shouldDisplayLeftImage = () => {
    if (mangaDirection === "ltr") {
      if (pages[page - 1]) {
        return true;
      }
    } else {
      if (pages[page]) {
        return true;
      }
    }

    return false;
  };

  const shouldDisplayRightImage = () => {
    if (mangaDirection === "ltr") {
      if (pages[page]) {
        return true;
      }
    } else {
      if (pages[page - 1]) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-screen overflow-y-auto">
      {displaySettings ? (
        <div
          className="absolute w-full h-[50px] flex items-center justify-between bg-secondary px-3"
          style={{
            top:
              import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
                ? "env(safe-area-inset-top)"
                : "0px",
            zIndex: 2000,
          }}
        >
          <div>
            {renderButton(<ArrowLeftIcon className="size-4" />, () => {
              const titlebar = document.querySelector(".titlebar");

              if (titlebar) {
                if (import.meta.env.VITE_PUBLIC_CUSTOM_TITLE === "true") {
                  (titlebar as any).style.display = "block";
                } else {
                  (titlebar as any).style.display = "none";
                }
              }

              if (directOpen) {
                navigate("/libraries");
              } else if (isLocal) {
                navigate(
                  `/manga/${manga?.series_id}?isLocal=true&server=${localServer}`
                );
              } else {
                navigate(`/manga/${manga?.series_id}`);
              }
            })}
          </div>
          <div className="flex flex-row items-center gap-2">
            {mangaViewMode === "single" && (
              <>
                {renderButton(
                  mangaFitMode === "contain" ? (
                    <MagnifyingGlassIcon className="size-4" />
                  ) : (
                    <MagnifyingGlassPlusIcon className="size-4" />
                  ),
                  () => {
                    setMangaFitMode(
                      mangaFitMode === "contain" ? "actual" : "contain"
                    );
                  }
                )}
              </>
            )}
            {renderButton(
              mangaDirection === "ltr" ? (
                <ChevronDoubleRightIcon className="size-4" />
              ) : (
                <ChevronDoubleLeftIcon className="size-4" />
              ),
              () => {
                setMangaDirection(mangaDirection === "ltr" ? "rtl" : "ltr");
              }
            )}
            {renderButton(
              mangaViewMode === "single" ? (
                <DocumentIcon className="size-4" />
              ) : (
                <DocumentPlusIcon className="size-4" />
              ),
              () => {
                setMangaViewMode(
                  mangaViewMode === "single" ? "double" : "single"
                );
              }
            )}
            {renderButton(
              isGrayscale ? (
                <PhotoIcon className="size-4 text-gray-500" />
              ) : (
                <PhotoIcon className="size-4" />
              ),
              () => {
                setIsGrayscale(!isGrayscale);
              }
            )}
            {renderButton(<Cog6ToothIcon className="size-4" />, () => {
              setDisplaySettings(!displaySettings);
            })}
          </div>
        </div>
      ) : (
        <div
          className="absolute w-full h-[50px] flex items-center justify-between bg-transparent px-3"
          style={{
            top:
              import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
                ? "env(safe-area-inset-top)"
                : "0px",
            zIndex: 2000,
          }}
        >
          <div>&nbsp;</div>
          <div className="flex flex-row items-center gap-2">
            {renderButton(<Cog6ToothIcon className="size-4" />, () => {
              setDisplaySettings(!displaySettings);
            })}
          </div>
        </div>
      )}
      {manga?.nextFile && pages.length > 0 && page >= pages.length && (
        <button
          className="absolute top-[35%] left-[1rem] flex w-[10rem] h-[30%]"
          onClick={() => {
            if (manga.nextFile) {
              getNextFile(manga.nextFile.id);
            }
          }}
          style={{
            zIndex: 99999,
          }}
        >
          <img
            src={
              !isLocal
                ? `${server}/preview-image/${
                    libraryData && (libraryData as unknown as Library)?.id
                  }/${manga.series_id}/${manga.nextFile.id}.jpg`
                : ``
            }
            className="w-full h-full object-cover rounded-xl"
          />
        </button>
      )}
      <div
        id={
          import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
            ? "manga-reader-mobile"
            : "manga-reader"
        }
        className={`${
          import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
            ? ""
            : "h-[calc(100dvh-0px)]"
        } flex flex-row items-center justify-between`}
        style={{
          marginTop:
            import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
              ? "env(safe-area-inset-top)"
              : "0px",
        }}
      >
        {pages && pages.length > 0 ? (
          <>
            {mangaViewMode === "single" ? (
              <div
                className={`${
                  import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
                    ? "manga-height"
                    : "h-[calc(100dvh-0px)]"
                } ${
                  mangaFitMode === "actual"
                    ? "flex-1"
                    : "flex-1 flex items-center justify-center"
                }`}
              >
                {mangaFitMode === "actual" ? (
                  <TransformWrapper>
                    <TransformComponent>
                      <img
                        src={pages[page - 1]}
                        alt="Manga Page"
                        className="w-full"
                        style={{
                          filter: isGrayscale ? "grayscale(100%)" : "none",
                          WebkitFilter: isGrayscale
                            ? "grayscale(100%)"
                            : "none",
                        }}
                      />
                    </TransformComponent>
                  </TransformWrapper>
                ) : (
                  <img
                    src={pages[page - 1]}
                    alt="Manga Page"
                    className={`${
                      mangaFitMode === "contain"
                        ? "w-full h-full object-contain"
                        : "object-fit"
                    }`}
                    style={{
                      filter: isGrayscale ? "grayscale(100%)" : "none",
                      WebkitFilter: isGrayscale ? "grayscale(100%)" : "none",
                    }}
                  />
                )}
              </div>
            ) : (
              <div
                className={`flex w-full ${
                  import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
                    ? "manga-height"
                    : "h-full"
                } max-h-full max-w-full object-contain`}
              >
                <div className="w-1/2 h-full flex items-center justify-end">
                  {shouldDisplayLeftImage() && (
                    <img
                      src={
                        mangaDirection === "ltr" ? pages[page - 1] : pages[page]
                      }
                      alt="Manga Page"
                      className="max-h-full max-w-full object-contain"
                      style={{
                        marginLeft:
                          mangaFitMode === "contain" ? "auto" : "auto",
                        marginRight: mangaFitMode === "contain" ? 0 : 0,
                        filter: isGrayscale ? "grayscale(100%)" : "none",
                        WebkitFilter: isGrayscale ? "grayscale(100%)" : "none",
                      }}
                    />
                  )}
                </div>
                <div className="w-1/2 h-full flex items-center justify-start">
                  {shouldDisplayRightImage() && (
                    <img
                      src={
                        mangaDirection === "ltr" ? pages[page] : pages[page - 1]
                      }
                      alt="Manga Page"
                      className="max-h-full max-w-full object-contain"
                      style={{
                        marginLeft: mangaFitMode === "contain" ? 0 : 0,
                        marginRight:
                          mangaFitMode === "contain" ? "auto" : "auto",
                        filter: isGrayscale ? "grayscale(100%)" : "none",
                        WebkitFilter: isGrayscale ? "grayscale(100%)" : "none",
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white">
            Currently loading...
          </div>
        )}
      </div>
      {displaySettings && (
        <div
          className="fixed w-full h-[50px] flex flex-col md:flex-row items-center justify-between bg-secondary px-3 gap-5"
          style={{
            bottom:
              import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
                ? "env(safe-area-inset-bottom)"
                : "0px",
            zIndex: 2000,
          }}
        >
          <div className="w-full md:w-[25%] flex flex-row gap-2 text-sm items-center">
            <span className="font-bold text-white">{t("read.jumpTo")}</span>
            <select
              className="bg-primary border border-secondary p-1 text-white rounded-lg"
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
            >
              {Array.from({ length: pages.length }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-row items-center justify-center gap-5 w-full md:w-[50%]">
            {renderButton(<ChevronLeftIcon className="size-4" />, () => {
              if (mangaDirection === "ltr") {
                goBack();
              } else {
                goForward();
              }
            })}
            <div className="text-sm text-white">
              {t("read.page")} {page} {t("read.of")} {pages.length}
            </div>
            {renderButton(<ChevronRightIcon className="size-4" />, () => {
              if (mangaDirection === "ltr") {
                goForward();
              } else {
                goBack();
              }
            })}
          </div>
          <div className="w-full md:w-[25%]">&nbsp;</div>
        </div>
      )}
      <div
        className="absolute top-0 left-0 h-[100dvh] w-[16rem]"
        style={{ zIndex: 100 }}
        onMouseDown={(e) => {
          e.preventDefault();
          if (mangaDirection === "ltr") {
            goBack();
          } else {
            goForward();
          }
        }}
        onWheel={(e) => {
          const containerId =
            import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
              ? "manga-reader-mobile"
              : "manga-reader";
          const mangaReader = document.getElementById(containerId);

          if (mangaReader) {
            const scrollableElement =
              mangaReader.querySelector(".manga-height, .overflow-y-auto") ||
              mangaReader.querySelector('[class*="h-[calc(100dvh-30px)]"]') ||
              mangaReader;
            scrollableElement.scrollBy(0, e.deltaY);
          }
        }}
      >
        &nbsp;
      </div>
      <div
        className="absolute top-0 right-0 h-[100dvh] w-[16rem]"
        style={{ zIndex: 100 }}
        onMouseDown={(e) => {
          e.preventDefault();
          if (mangaDirection === "ltr") {
            goForward();
          } else {
            goBack();
          }
        }}
        onWheel={(e) => {
          const containerId =
            import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
              ? "manga-reader-mobile"
              : "manga-reader";
          const mangaReader = document.getElementById(containerId);

          if (mangaReader) {
            const scrollableElement =
              mangaReader.querySelector(".manga-height, .overflow-y-auto") ||
              mangaReader.querySelector('[class*="h-[calc(100dvh-30px)]"]') ||
              mangaReader;
            scrollableElement.scrollBy(0, e.deltaY);
          }
        }}
      >
        &nbsp;
      </div>
    </div>
  );
}
