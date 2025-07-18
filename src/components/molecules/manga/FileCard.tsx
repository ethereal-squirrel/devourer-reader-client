import { memo, useCallback, useMemo, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";

import { useImageLoader } from "../../../hooks/useImageLoader";
import { Library } from "../../../hooks/useLibrary";
import { File, Series, useManga } from "../../../hooks/useManga";
import { useLibraryStore } from "../../../store/library";
import { FolderArrowDownIcon, FolderPlusIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";

const FileCard = memo(
  function FileCard({
    entity,
    offline,
    series,
  }: {
    entity: File;
    offline?: boolean;
    series: Series;
  }) {
    const { libraryData } = useLibraryStore(
      useShallow((state) => ({
        libraryData: state.libraryData as unknown as Library,
      }))
    );
    const navigate = useNavigate();
    const {
      isFileAvailableOffline,
      makeSeriesAvailableOffline,
      makeSeriesUnavailableOffline,
    } = useManga();
    const [isAvailableOffline, setIsAvailableOffline] = useState(false);

    const imageRef = useRef<HTMLImageElement>(null);

    const { imagePath, isLoading } = useImageLoader({
      type: "file",
      entity,
      libraryId: libraryData?.id,
      offline,
    });

    useEffect(() => {
      if (!offline) {
        isFileAvailableOffline(entity.id).then((isAvailable) => {
          setIsAvailableOffline(isAvailable);
        });
      }
    }, [offline, entity.file_id, isFileAvailableOffline]);

    useEffect(() => {
      if (imagePath && imageRef.current) {
        const img = imageRef.current;

        if (img.src !== imagePath) {
          img.src = imagePath;
        }

        const preloader = new Image();
        preloader.src = imagePath;
        preloader.onload = () => {
          if (img.src === imagePath && img.complete) {
            img.style.opacity = "1";
          }
        };
      }
    }, [imagePath]);

    const handleClick = useCallback(() => {
      if (!libraryData) return;

      const path =
        libraryData.type === "manga"
          ? `/manga/${offline ? (entity as File).file_id : entity.id}/read${
              offline
                ? `?isLocal=true&server=${
                    (entity as File & { server: string }).server
                  }`
                : ""
            }`
          : `/book/${offline ? (entity as File).file_id : entity.id}/read${
              offline
                ? `?isLocal=true&server=${
                    (entity as File & { server: string }).server
                  }`
                : ""
            }`;

      navigate(path);
    }, [libraryData, entity.id, offline, navigate]);

    const displayTitle = useMemo(() => {
      return entity.volume > 0
        ? `Vol. ${entity.volume}`
        : entity.chapter > 0
        ? `Ch. ${entity.chapter}`
        : entity.file_name;
    }, [entity]);

    const isRead = useMemo(() => {
      return entity.is_read;
    }, [entity]);

    if (!libraryData || isLoading) {
      return (
        <div className="bg-primary text-white rounded-xl flex flex-col h-full animate-pulse">
          <div className="h-[16rem] bg-gray-300 rounded-t-xl"></div>
          <div className="text-sm p-3 flex-1 flex items-center justify-center">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      );
    }

    return (
      <button
        className="bg-primary text-white rounded-xl flex flex-col hover:cursor-pointer h-full transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => {
          if (
            import.meta.env.VITE_PUBLIC_IS_ANDROID === "1" &&
            (entity.file_name.endsWith(".rar") ||
              entity.file_name.endsWith(".cbr"))
          ) {
            toast.error("RAR files are not supported on Android.", {
              style: {
                backgroundColor: "#111827",
                color: "#fff",
              },
              position: "bottom-right",
            });
          } else {
            handleClick();
          }
        }}
        style={{
          contain: "layout style paint",
        }}
      >
        <div className="h-[14rem] relative overflow-hidden">
          <div
            className={
              Number(entity.current_page) > 1 &&
              Number(entity.current_page) === Number(entity.total_pages)
                ? "opacity-50"
                : ""
            }
          >
            <img
              ref={imageRef}
              src={imagePath || ""}
              alt={entity.file_name}
              className="w-full h-full object-cover rounded-t-xl"
              style={{
                willChange: "auto",
                opacity: "0.5",
                transition: "opacity 0.2s ease-in-out",
              }}
              onLoad={(e) => {
                const img = e.currentTarget;
                img.style.opacity = "1";
              }}
              onError={(e) => {
                const img = e.currentTarget;
                if (imagePath && img.src !== imagePath) {
                  setTimeout(() => {
                    img.src = imagePath;
                  }, 100);
                }
              }}
            />
          </div>
          <button
            className="absolute top-1 left-1 bg-black/75 text-white p-2 rounded-full hover:cursor-pointer"
            style={{
              zIndex: 1000,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (isAvailableOffline || offline) {
                makeSeriesUnavailableOffline(series, entity);
              } else {
                makeSeriesAvailableOffline(series, entity);
              }
            }}
          >
            {isAvailableOffline || offline ? (
              <FolderArrowDownIcon className="w-4 h-4 text-green-500" />
            ) : (
              <FolderPlusIcon className="w-4 h-4" />
            )}
          </button>
          {isRead ||
          Number(entity.current_page) === Number(entity.total_pages) ? (
            <div className="absolute top-1 right-1 bg-black/75 text-white p-1 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          ) : (
            <>
              {Number(entity.current_page) > 1 && (
                <div className="absolute top-1 right-1 bg-black/75 text-white p-1 rounded-xl text-sm px-2 py-1">
                  {entity.current_page} / {entity.total_pages}
                </div>
              )}
            </>
          )}
          <div className="absolute bottom-1 left-1 right-1 bg-black/80 rounded-lg text-sm px-3 py-1 flex-1 flex items-center justify-center">
            <span className="line-clamp-3 text-center leading-relaxed">
              {displayTitle}
            </span>
          </div>
        </div>
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.entity.id === nextProps.entity.id &&
      prevProps.entity.volume === nextProps.entity.volume &&
      prevProps.entity.chapter === nextProps.entity.chapter &&
      prevProps.offline === nextProps.offline &&
      prevProps.entity.is_read === nextProps.entity.is_read
    );
  }
);

export default FileCard;
