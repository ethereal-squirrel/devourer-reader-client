import { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/solid";

import { Book } from "../../../hooks/useBook";
import { useImageLoader } from "../../../hooks/useImageLoader";
import { Library, useLibrary } from "../../../hooks/useLibrary";
import { Series } from "../../../hooks/useManga";
import { useLibraryStore } from "../../../store/library";

const LibraryCard = memo(
  function LibraryCard({
    entity,
    offline,
    fromCollection,
  }: {
    entity: Book | Series;
    offline?: boolean;
    fromCollection?: number;
  }) {
    const { libraryData } = useLibraryStore(
      useShallow((state) => ({
        libraryData: state.libraryData as unknown as Library,
      }))
    );
    const { removeFromCollection, retrieveLibrary } = useLibrary();
    const navigate = useNavigate();

    const imageRef = useRef<HTMLImageElement>(null);

    const { imagePath, isLoading } = useImageLoader({
      type: libraryData?.type || "book",
      entity,
      libraryId: libraryData?.id,
      offline,
    });

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
          ? `/manga/${offline ? (entity as Series).series_id : entity.id}${
              fromCollection ? `?fromCollection=${fromCollection}` : ""
            }${
              offline
                ? `?isLocal=true&server=${
                    (entity as (Book | Series) & { server: string }).server
                  }`
                : ""
            }`
          : `/book/${offline ? (entity as Book).file_id : entity.id}${
              fromCollection ? `?fromCollection=${fromCollection}` : ""
            }${
              offline
                ? `?isLocal=true&server=${
                    (entity as (Book | Series) & { server: string }).server
                  }`
                : ""
            }`;

      navigate(path);
    }, [libraryData, entity.id, offline, navigate]);

    const displayTitle = useMemo(() => {
      if (libraryData?.type === "book") {
        const book = entity as Book;
        return book.metadata?.epub?.title && book.metadata.epub.title.length > 0
          ? book.metadata.epub.title
          : book.metadata?.original_title || book.title;
      } else {
        const manga = entity as Series;

        if (manga.manga_data.titles) {
          const title = manga.manga_data.titles.find(
            (title: any) => title.type === "English"
          );

          if (title) {
            return title.title;
          }
        }

        return manga.title;
      }
    }, [libraryData, entity]);

    const isRead = useMemo(() => {
      return libraryData?.type === "book" && (entity as Book).is_read;
    }, [libraryData, entity]);

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
        aria-label={displayTitle}
        onClick={handleClick}
        style={{
          contain: "layout style paint",
        }}
      >
        <div className="h-[16rem] w-full relative overflow-hidden">
          <img
            ref={imageRef}
            src={imagePath || ""}
            alt={entity.title}
            className="w-full h-full object-cover rounded-t-xl"
            style={{
              willChange: "auto",
              opacity: imagePath ? "1" : "0",
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
          {entity.rating && entity.rating > 0 && (
            <div className="absolute bottom-1 left-1 flex flex-row items-center gap-2 bg-black/50 rounded-full p-1">
              {Array.from({ length: entity.rating || 0 }).map((_, index) => (
                <StarIcon
                  key={index}
                  className={`w-4 h-4 ${
                    index < (entity.rating || 0)
                      ? "text-yellow-500"
                      : "text-gray-500"
                  }`}
                />
              ))}
            </div>
          )}
          {fromCollection && Number(fromCollection) > 0 && (
            <button
              className="absolute top-1 left-1 flex flex-row items-center gap-2 bg-black/50 rounded-full p-1 hover:cursor-pointer"
              onClick={async (e) => {
                e.stopPropagation();

                let outcome = false;

                if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile") {
                  outcome = await window.confirm(
                    "Are you sure you want to remove this item from the collection?"
                  );
                } else {
                  outcome = window.confirm(
                    "Are you sure you want to remove this item from the collection?"
                  );
                }

                if (outcome) {
                  await removeFromCollection(fromCollection, entity.id);
                  await new Promise((resolve) => setTimeout(resolve, 50));
                  await retrieveLibrary(libraryData.id);
                  await new Promise((resolve) => setTimeout(resolve, 50));
                }
              }}
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          )}
          {isRead && (
            <div className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full">
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
          )}
        </div>
        <div className="text-sm w-full p-3 flex-1 flex items-center justify-center">
          <span className="line-clamp-3 text-center leading-relaxed">
            {displayTitle}
          </span>
        </div>
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.entity.id === nextProps.entity.id &&
      prevProps.entity.title === nextProps.entity.title &&
      prevProps.offline === nextProps.offline &&
      (prevProps.entity as Book).is_read === (nextProps.entity as Book).is_read
    );
  }
);

export default LibraryCard;
