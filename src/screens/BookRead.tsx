import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { join } from "@tauri-apps/api/path";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { BaseDirectory, mkdir, remove } from "@tauri-apps/plugin-fs";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ReactReader, ReactReaderStyle } from "react-reader";
import { pdfjs, Document, Page } from "react-pdf";
import { toast } from "react-toastify";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  MinusIcon,
  PlusIcon,
  SunIcon,
} from "@heroicons/react/24/solid";

import { Book, useBook } from "../hooks/useBook";
import { Library, useLibrary } from "../hooks/useLibrary";
import { useShared } from "../hooks/useShared";
import { db } from "../lib/database";
import { useCommonStore } from "../store/common";
import { useOpdsStore } from "../store/opds";
import { useLibraryStore } from "../store/library";
import { useUIStore } from "../store/ui";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const availableFonts = [
  "Lexend",
  "ComicNeue-Regular",
  "EBGaramond-Regular",
  "Baskervville",
];

export default function BookReadScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLocal = searchParams.get("isLocal") === "true";
  const localServer = searchParams.get("server");
  const opdsType = searchParams.get("opdsType");
  const opdsUrl = searchParams.get("opdsUrl");
  const fromCollection = searchParams.get("fromCollection");
  const { retrieveBook, retrieveLocalBook } = useBook();
  const { retrieveLibrary } = useLibrary();
  const { libraryData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData,
    }))
  );
  const { pageEvent } = useShared();
  const navigate = useNavigate();
  const retrievingBook = useRef<boolean>(false);
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { opdsUrl: opdsUrlStore } = useOpdsStore(
    useShallow((state) => ({
      opdsUrl: state.opdsUrl,
    }))
  );
  const {
    bookTheme,
    bookCustomBackground,
    bookCustomForeground,
    bookCustomFontSize,
    bookCustomFontFamily,
    setBookCustomFontFamily,
    setBookTheme,
    setBookCustomFontSize,
  } = useUIStore(
    useShallow((state) => ({
      bookTheme: state.bookTheme,
      bookCustomBackground: state.bookCustomBackground,
      bookCustomForeground: state.bookCustomForeground,
      bookCustomFontSize: state.bookCustomFontSize,
      bookCustomFontFamily: state.bookCustomFontFamily,
      setBookCustomFontFamily: state.setBookCustomFontFamily,
      setBookTheme: state.setBookTheme,
      setBookCustomFontSize: state.setBookCustomFontSize,
    }))
  );

  const [book, setBook] = useState<Book | null>(null);
  const [bookPath, setBookPath] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [location, setLocation] = useState<string | number | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const rendition = useRef<any>(null);
  const toc = useRef<any[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const stylesInjected = useRef<boolean>(false);

  const customTheme = {
    ...ReactReaderStyle,
    arrow: {
      ...ReactReaderStyle.arrow,
      color: bookCustomForeground,
    },
    arrowHover: {
      ...ReactReaderStyle.arrowHover,
      color: bookCustomForeground,
    },
    readerArea: {
      ...ReactReaderStyle.readerArea,
      backgroundColor: bookCustomBackground,
      transition: undefined,
    },
    titleArea: {
      ...ReactReaderStyle.titleArea,
      color: bookCustomForeground,
    },
    tocArea: {
      ...ReactReaderStyle.tocArea,
      background: bookCustomBackground,
    },
    tocButtonExpanded: {
      ...ReactReaderStyle.tocButtonExpanded,
      background: bookCustomBackground,
    },
    tocButtonBar: {
      ...ReactReaderStyle.tocButtonBar,
      background: bookCustomForeground,
    },
    tocButton: {
      ...ReactReaderStyle.tocButton,
      color: bookCustomForeground,
    },
  };

  const getBook = async () => {
    if (retrievingBook.current) {
      return;
    }

    retrievingBook.current = true;

    if (!id && !opdsUrl) {
      return null;
    }

    let bookEntity: Book | null = null;

    if (isLocal) {
      bookEntity = await retrieveLocalBook(Number(id), localServer || "");

      if (!bookEntity) {
        throwLoadError(t("book.bookNotFound"));
        return false;
      }

      console.log("[BookRead.tsx] epub location", bookEntity.current_page);

      if (
        bookEntity.current_page &&
        bookEntity.current_page !== 0 &&
        bookEntity.current_page !== "0"
      ) {
        if (bookEntity.file_format === "epub") {
          setLocation(bookEntity.current_page);
        } else {
          setPage(Number(bookEntity.current_page));
        }
      }

      const safeServer = server?.replace(/[/:?&]/g, "_") || "";
      const localDataDir = await appLocalDataDir();

      const pathToBook = await join(
        localDataDir,
        String(BaseDirectory.AppLocalData),
        safeServer,
        "books",
        String(bookEntity?.file_id),
        "files",
        bookEntity.file_name
      );

      setBook(bookEntity);
      setBookPath(convertFileSrc(pathToBook));
    } else {
      if (opdsType && opdsUrl) {
        await downloadBook(
          opdsType === "opds-pdf" ? "opds-pdf" : "opds-epub",
          undefined,
          undefined,
          opdsUrl
        );

        setBook({
          id: 0,
          file_id: 0,
          title: "",
          path: "",
          file_name: "",
          file_format: opdsType === "opds-pdf" ? "pdf" : "epub",
          current_page: 0,
          total_pages: 0,
          is_read: false,
          library_id: 0,
          metadata: {},
        });
      } else {
        bookEntity = await retrieveBook(Number(id));

        if (!bookEntity) {
          throwLoadError(t("book.bookNotFound"));
          return false;
        }

        console.log("[BookRead.tsx] epub location", bookEntity.current_page);

        if (
          bookEntity.current_page &&
          bookEntity.current_page !== 0 &&
          bookEntity.current_page !== "0"
        ) {
          if (bookEntity.file_format === "epub") {
            console.log(
              "[BookRead.tsx] epub location :(",
              bookEntity.current_page
            );
            setLocation(bookEntity.current_page);
          } else {
            setPage(Number(bookEntity.current_page));
          }
        }

        setBook(bookEntity);
        await downloadBook("devourer", bookEntity, server);
      }
    }
  };

  function updateTheme(rendition: any, theme: any) {
    const themes = rendition.themes;
    switch (theme) {
      case "dark": {
        themes.override("color", "#fff");
        themes.override("background", "#000");
        break;
      }
      case "light": {
        themes.override("color", "#000");
        themes.override("background", "#fff");
        break;
      }
      case "custom": {
        themes.override("color", bookCustomForeground);
        themes.override("background", bookCustomBackground);
        break;
      }
    }
  }

  const downloadBook = async (
    type: "devourer" | "opds-pdf" | "opds-epub",
    book?: Book,
    server?: null | string,
    opdsUrl?: string
  ) => {
    const safeServer = server?.replace(/[/:?&]/g, "_") || "";

    let localDataDir = null as string | null;

    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM !== "web") {
      localDataDir = await appLocalDataDir();
    }

    let fileName = null as string | null;
    let pathToBook = null as string | null;

    if (!isLocal) {
      if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "web") {
        if (type === "opds-pdf" || type === "opds-epub") {
          setLocation(null);
          setBookPath(opdsUrl || "");
        } else {
          setLocation(null);
          setBookPath(
            `${server}/stream/${(libraryData as unknown as Library)?.id}/${
              book!.id
            }`
          );
        }
      } else {
        try {
          await mkdir(`${BaseDirectory.AppLocalData}`, {
            baseDir: BaseDirectory.AppLocalData,
            recursive: true,
          });
        } catch (error) {
          console.error("Error creating directory", error);
        }

        if (type === "opds-pdf" || type === "opds-epub") {
          if (!opdsUrl) {
            throwLoadError(t("book.bookNotFound"));
            return;
          }

          console.log("Downloading book from OPDS.");

          pathToBook = await join(
            localDataDir || "",
            String(BaseDirectory.AppLocalData),
            type === "opds-pdf" ? "current.pdf" : "current.epub"
          );

          try {
            await remove(pathToBook);
          } catch (error) {
            console.error("Error removing file", error);
          }

          try {
            let url = null as string | null;

            if (opdsUrl.includes("local:")) {
              url = opdsUrl.replace("local:", "");
              url = convertFileSrc(url);

              setLocation(null);
              setBookPath(url);
              return;
            } else {
              url = new URL(
                opdsUrl.includes("asset.localhost")
                  ? opdsUrl
                  : decodeURIComponent(opdsUrl),
                opdsUrlStore || ""
              ).toString();
            }

            console.log("Downloading book from:", url, "to:", pathToBook);

            await invoke("download_file", {
              url,
              path: pathToBook,
            });

            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch (error) {
            console.error("invoke", error);
            throwLoadError("Failed to download book.");
          }
        } else {
          if (!book || !server) {
            throwLoadError(t("book.bookNotFound"));
            return;
          }

          console.log("Checking for offline availability.");

          const results = await db.select(
            "SELECT * FROM BookFile WHERE file_id = ? AND server = ?",
            [book.id, server]
          );

          if (results && results.length > 0) {
            console.log("Book is available offline.");
            fileName = results[0].file_name;

            if (!fileName) {
              throwLoadError(t("book.bookNotFound"));
              return;
            }

            pathToBook = await join(
              localDataDir || "",
              String(BaseDirectory.AppLocalData),
              safeServer,
              "books",
              String(book.id),
              "files",
              fileName
            );
          } else {
            console.log(
              "Book is not available offline, attempting to download from remote source."
            );

            let fileName = null as string | null;

            switch (book.file_format) {
              case "epub":
                fileName = "current.epub";
                break;
              case "pdf":
                fileName = "current.pdf";
                break;
            }

            if (!fileName) {
              throwLoadError("File format not supported.");
              return;
            }

            pathToBook = await join(
              localDataDir || "",
              String(BaseDirectory.AppLocalData),
              fileName
            );

            const url = `${server}/stream/${
              (libraryData as unknown as Library)?.id
            }/${book.id}`;
            console.log(
              "Attempting to download book from:",
              url,
              "to:",
              pathToBook
            );

            try {
              await remove(pathToBook);
            } catch (error) {
              console.error("Error removing file", error);
            }

            try {
              await invoke("download_file", {
                url,
                path: pathToBook,
              });

              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (error) {
              console.error("invoke", error);
              throwLoadError("Failed to download book.");
            }

            if (
              book.file_format !== "epub" &&
              book.current_page &&
              book.current_page !== "0"
            ) {
              setPage(1);
            }
          }
        }

        if (pathToBook) {
          if (type === "opds-pdf" || type === "opds-epub") {
            setPage(1);
          }

          setBookPath(convertFileSrc(pathToBook));
        } else {
          throwLoadError(t("book.bookNotFound"));
          return;
        }
      }
    }
  };

  const calculatePageHeight = () => {
    const availableHeight = window.innerHeight - 100;
    const availableWidth = window.innerWidth;
    setPageHeight(availableHeight);
    setPageWidth(availableWidth);
  };

  const goBack = () => {
    if (page === 1) {
      return;
    }

    let targetPage: null | number = null;

    if (isLandscape) {
      if (page - 1 === 1) {
        targetPage = 1;
        return;
      }

      targetPage = page - 2;
    } else {
      targetPage = page - 1;
    }

    if (targetPage && !opdsType && !opdsUrl?.includes("local")) {
      pageEvent(
        targetPage,
        isLocal,
        (libraryData as unknown as Library)?.id || 0,
        isLocal ? book?.file_id || 0 : book?.id || 0,
        localServer || ""
      );
      setPage(targetPage);
    }
  };

  const goForward = () => {
    if (page === numPages) {
      return;
    }

    let targetPage: null | number = null;

    if (isLandscape) {
      if (page + 1 === numPages) {
        targetPage = numPages;
        return;
      }

      targetPage = page + 2;
    } else {
      if (page + 1 === numPages) {
        targetPage = numPages;
        return;
      }

      targetPage = page + 1;
    }

    if (targetPage && !opdsType && !opdsUrl?.includes("local")) {
      pageEvent(
        targetPage,
        isLocal,
        (libraryData as unknown as Library)?.id || 0,
        isLocal ? book?.file_id || 0 : book?.id || 0,
        localServer || ""
      );
      setPage(targetPage);
    }
  };

  const throwLoadError = async (message: string) => {
    console.error("Error loading book:", message);
    toast.error(t("book.errorLoadingBook"), {
      position: "bottom-right",
      style: {
        backgroundColor: "#111827",
        color: "#fff",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    navigate("/");
  };

  useEffect(() => {
    if ((book && book.file_format === "pdf") || opdsType === "opds-pdf") {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") {
          goBack();
        } else if (event.key === "ArrowRight") {
          goForward();
        }
      };

      window.addEventListener("keydown", handleKeyPress);

      return () => {
        window.removeEventListener("keydown", handleKeyPress);
      };
    }
  }, [book, opdsType, goForward, goBack]);

  useEffect(() => {
    if (book && bookPath) {
      return;
    }

    if ((!isLocal && libraryData && id) || (opdsType && opdsUrl)) {
      getBook();
    }

    if (isLocal && id) {
      getBook();
    }
  }, [id, libraryData, getBook, opdsType, opdsUrl]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    setIsLandscape(mediaQuery.matches);

    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
    };

    mediaQuery.addEventListener("change", handleOrientationChange);

    return () => {
      mediaQuery.removeEventListener("change", handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("resize", calculatePageHeight);
    return () => window.removeEventListener("resize", calculatePageHeight);
  }, []);

  useLayoutEffect(() => {
    calculatePageHeight();
  }, [bookPath, book, isLandscape, numPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  useEffect(() => {
    if (rendition.current) {
      rendition.current.themes.fontSize(`${bookCustomFontSize}%`);
    }
  }, [bookCustomFontSize]);

  useEffect(() => {
    if (rendition.current) {
      updateTheme(rendition.current, bookTheme);
    }
  }, [bookTheme]);

  useEffect(() => {
    if (bookPath && bookCustomFontFamily) {
      let retryCount = 0;
      const maxRetries = 50;

      const waitForIframe = () => {
        const iframe = document.querySelector("iframe");

        if (iframe && iframe.contentWindow?.document.head) {
          const head = iframe.contentWindow.document.head;

          const existingStyles = head.querySelectorAll(
            "style[data-epub-font-injection]"
          );
          existingStyles.forEach((style) => style.remove());

          const style = document.createElement("style");
          style.setAttribute("data-epub-font-injection", "true");
          style.textContent = `
            @font-face {
              font-family: "Lexend";
              src: url("/fonts/Lexend/Lexend-VariableFont_wght.ttf") format("truetype");
              font-weight: 100 900;
              font-stretch: 75% 100%;
              font-style: normal;
            }
            @font-face {
              font-family: "ComicNeue-Regular";
              src: url("/fonts/Comic_Neue/ComicNeue-Regular.ttf") format("truetype");
              font-weight: 100 900;
              font-stretch: 75% 100%;
              font-style: normal;
            }
            @font-face {
              font-family: "EBGaramond-Regular";
              src: url("/fonts/EB_Garamond/EBGaramond-VariableFont_wght.ttf") format("truetype");
              font-weight: 100 900;
              font-stretch: 75% 100%;
              font-style: normal;
            }
            @font-face {
              font-family: "Baskervville";
              src: url("/fonts/Baskervville/Baskervville-VariableFont_wght.ttf") format("truetype");
              font-weight: 100 900;
              font-stretch: 75% 100%;
              font-style: normal;
            }
            h1 { font-family: ${bookCustomFontFamily}, system-ui, -apple-system, sans-serif !important; }
            h2 { font-family: ${bookCustomFontFamily}, system-ui, -apple-system, sans-serif !important; }
            h3 { font-family: ${bookCustomFontFamily}, system-ui, -apple-system, sans-serif !important; }
            h4 { font-family: ${bookCustomFontFamily}, system-ui, -apple-system, sans-serif !important; }
            h5 { font-family: ${bookCustomFontFamily}, system-ui, -apple-system, sans-serif !important; }
            h6 { font-family: ${bookCustomFontFamily}, system-ui, -apple-system, sans-serif !important; }
            p { font-family: ${bookCustomFontFamily}, system-ui, -apple-system, sans-serif !important; }
          `;
          head.appendChild(style);
          stylesInjected.current = true;
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(waitForIframe, 100);
        }
      };

      stylesInjected.current = false;
      const timeoutId = setTimeout(waitForIframe, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [bookPath, bookCustomFontFamily]);

  const renderButton = (icon: React.ReactNode, onClick: () => void) => {
    return (
      <button
        className="bg-primary text-white rounded-full p-2 hover:bg-tertiary hover:cursor-pointer"
        onClick={onClick}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className="h-[100vh] w-screen overflow-hidden">
      <div
        className="mt-[30px] h-[50px] flex items-center justify-between px-3"
        style={{
          backgroundColor:
            bookTheme === "dark"
              ? "#000"
              : bookTheme === "light"
              ? "#fff"
              : bookCustomBackground,
        }}
      >
        <div>
          {renderButton(<ArrowLeftIcon className="size-4" />, async () => {
            if (!isLocal && !opdsUrl?.includes("local")) {
              retrieveLibrary((libraryData as unknown as Library)?.id || 0);
            }

            if (fromCollection) {
              navigate(`/book/${book?.id}?fromCollection=${fromCollection}`);
            } else {
              navigate(-1);
            }
          })}
        </div>
        <div className="flex flex-row items-center gap-2">
          {renderButton(<SunIcon className="size-4" />, () => {
            if (bookTheme === "light") {
              setBookTheme("dark");
            } else if (bookTheme === "dark") {
              setBookTheme("custom");
            } else {
              setBookTheme("light");
            }
          })}
          {renderButton(<MinusIcon className="size-4" />, () => {
            if (bookCustomFontSize === 10) {
              return;
            }

            setBookCustomFontSize(bookCustomFontSize - 10);
          })}
          {renderButton(<PlusIcon className="size-4" />, () => {
            if (bookCustomFontSize === 200) {
              return;
            }

            setBookCustomFontSize(bookCustomFontSize + 10);
          })}
          {renderButton(<BookOpenIcon className="size-4" />, () => {
            const currentFont = bookCustomFontFamily;
            const currentIndex = availableFonts.indexOf(currentFont);
            const nextIndex = (currentIndex + 1) % availableFonts.length;
            const nextFont = availableFonts[nextIndex];
            setBookCustomFontFamily(nextFont);
          })}
        </div>
      </div>
      <div
        id="book-reader"
        className={`${
          import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
            ? "h-[calc(100vh-50px)]"
            : "h-[calc(100vh-80px)]"
        } overflow-hidden ${bookCustomFontFamily.toLowerCase()}`}
      >
        {book && bookPath && (
          <>
            {opdsType === "opds-epub" || book?.file_format === "epub" ? (
              <div
                className={`w-screen ${
                  import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
                    ? "h-[calc(100vh-50px)]"
                    : "h-[calc(100vh-80px)]"
                }`}
              >
                <ReactReader
                  url={bookPath}
                  location={location !== "0" ? location : null}
                  locationChanged={(loc: string) => {
                    setLocation(loc);

                    if (!opdsType && !opdsUrl?.includes("local")) {
                      pageEvent(
                        loc,
                        isLocal,
                        (libraryData as unknown as Library)?.id || 0,
                        isLocal ? book.file_id : book.id,
                        localServer || ""
                      );
                    }
                  }}
                  tocChanged={(_toc) => (toc.current = _toc)}
                  epubInitOptions={{
                    openAs: "epub",
                  }}
                  epubOptions={{
                    allowPopups: true,
                    allowScriptedContent: true,
                  }}
                  readerStyles={
                    bookTheme === "dark"
                      ? darkReaderTheme
                      : bookTheme === "light"
                      ? lightReaderTheme
                      : customTheme
                  }
                  getRendition={(_rendition) => {
                    const spine_get = _rendition.book.spine.get.bind(
                      _rendition.book.spine
                    );
                    _rendition.book.spine.get = function (target: any) {
                      let t = spine_get(target);
                      while (t == null && target.startsWith("../")) {
                        target = target.substring(3);
                        t = spine_get(target);
                      }
                      return t;
                    };

                    rendition.current = _rendition;
                    rendition.current.themes.fontSize(`${bookCustomFontSize}%`);
                    rendition.current.themes.register("custom", {
                      h1: {
                        "font-family": `${bookCustomFontFamily}`,
                      },
                      h2: {
                        "font-family": `${bookCustomFontFamily}`,
                      },
                      h3: {
                        "font-family": `${bookCustomFontFamily}`,
                      },
                      p: {
                        "font-family": `${bookCustomFontFamily}`,
                      },
                    });
                    rendition.current.themes.select("custom");
                  }}
                />
              </div>
            ) : (
              <>
                <div
                  ref={pdfContainerRef}
                  className="w-screen overflow-y-hidden"
                  style={{
                    height:
                      import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile"
                        ? "calc(100vh - 50px)"
                        : "calc(100vh - 80px)",
                  }}
                >
                  <Document
                    file={bookPath}
                    onLoadSuccess={onDocumentLoadSuccess}
                    renderMode="canvas"
                    className={`${isLandscape ? "flex flex-row gap-0" : ""}`}
                  >
                    {!isLandscape ? (
                      <Page
                        key={`${page}-${bookCustomBackground}`}
                        height={isLandscape ? pageHeight || 0 : undefined}
                        pageNumber={page}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        className="w-screen h-[100vh]"
                        width={!isLandscape ? pageWidth || 0 : undefined}
                      />
                    ) : (
                      <>
                        <Page
                          key={`${page}-${bookCustomBackground}`}
                          height={isLandscape ? pageHeight || 0 : undefined}
                          pageNumber={page}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                          className="w-screen h-[100vh]"
                          width={!isLandscape ? pageWidth || 0 : undefined}
                        />
                        {numPages && page + 1 <= numPages && (
                          <Page
                            key={`${page + 1}-${bookCustomBackground}`}
                            height={isLandscape ? pageHeight || 0 : undefined}
                            pageNumber={page + 1}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            className="w-screen h-[100vh]"
                            width={!isLandscape ? pageWidth || 0 : undefined}
                          />
                        )}
                      </>
                    )}
                  </Document>
                </div>
                <div
                  ref={footerRef}
                  className="w-full h-[50px] absolute bottom-0 text-gray-600 flex items-center justify-center"
                >
                  <div className="flex flex-row items-center gap-2">
                    {renderButton(<ArrowLeftIcon className="size-4" />, goBack)}
                    <p>
                      {t("read.page")} {page} {t("read.of")} {numPages || 0}
                    </p>
                    {renderButton(
                      <ArrowRightIcon className="size-4" />,
                      goForward
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const lightReaderTheme = {
  ...ReactReaderStyle,
  readerArea: {
    ...ReactReaderStyle.readerArea,
    transition: undefined,
  },
};

const darkReaderTheme = {
  ...ReactReaderStyle,
  arrow: {
    ...ReactReaderStyle.arrow,
    color: "white",
  },
  arrowHover: {
    ...ReactReaderStyle.arrowHover,
    color: "#ccc",
  },
  readerArea: {
    ...ReactReaderStyle.readerArea,
    backgroundColor: "#000",
    transition: undefined,
  },
  titleArea: {
    ...ReactReaderStyle.titleArea,
    color: "#ccc",
  },
  tocArea: {
    ...ReactReaderStyle.tocArea,
    background: "#111",
  },
  tocButtonExpanded: {
    ...ReactReaderStyle.tocButtonExpanded,
    background: "#222",
  },
  tocButtonBar: {
    ...ReactReaderStyle.tocButtonBar,
    background: "#fff",
  },
  tocButton: {
    ...ReactReaderStyle.tocButton,
    color: "white",
  },
};
