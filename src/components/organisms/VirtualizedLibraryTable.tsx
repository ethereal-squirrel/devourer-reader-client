import React, { useRef, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Book } from "../../hooks/useBook";
import { Library } from "../../hooks/useLibrary";
import { Series } from "../../hooks/useManga";
import { useShallow } from "zustand/react/shallow";
import { useLibraryStore } from "../../store/library";

interface VirtualizedLibraryTableProps {
  series: (Book | Series)[];
  isLandscape: boolean;
  offline?: boolean;
}

const VirtualTableRow = React.memo(function VirtualTableRow({
  entity,
  isLandscape,
  isEven,
  offline,
}: {
  entity: Book | Series;
  isLandscape: boolean;
  isEven: boolean;
  offline?: boolean;
}) {
  const navigate = useNavigate();
  const { libraryData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData as unknown as Library | null,
    }))
  );

  const handleRowClick = useCallback(() => {
    if (!libraryData) return;

    const path =
      libraryData.type === "manga"
        ? `/manga/${offline ? (entity as Series).series_id : entity.id}${
            offline
              ? `?isLocal=true&server=${
                  (entity as (Book | Series) & { server: string }).server
                }`
              : ""
          }`
        : `/book/${offline ? (entity as Book).file_id : entity.id}${
            offline
              ? `?isLocal=true&server=${
                  (entity as (Book | Series) & { server: string }).server
                }`
              : ""
          }`;
    navigate(path);
  }, [libraryData, entity.id, navigate]);

  const handleViewClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleRowClick();
    },
    [handleRowClick]
  );

  if (!libraryData) return null;

  return (
    <div
      className={`flex items-center p-3 cursor-pointer hover:bg-opacity-80 virtual-table-row ${
        isEven ? "bg-primary" : "bg-input"
      } text-white text-sm`}
      onClick={handleRowClick}
      style={{
        minHeight: "60px",
        marginBottom: "10px",
      }}
    >
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="truncate">
          {libraryData.type === "book" ? (
            <>
              {(entity as Book).metadata?.epub?.title &&
              (entity as Book).metadata.epub.title.length > 0
                ? (entity as Book).metadata.epub.title
                : (entity as Book).metadata?.original_title || entity.title}
            </>
          ) : (
            entity.title
          )}
        </span>
        {libraryData.type === "book" && (entity as Book).is_read && (
          <div className="bg-black/50 text-white p-1 rounded-full flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
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
      {isLandscape && libraryData.type === "book" && (
        <>
          <div className="flex-1 px-3 min-w-0">
            <span className="truncate block">
              {(entity as Book).metadata?.authors?.join(", ") || ""}
            </span>
          </div>
          <div className="flex-1 px-3 min-w-0">
            <span className="truncate block">
              {(entity as Book).metadata?.genres?.join(", ") || ""}
            </span>
          </div>
          <div className="flex-1 px-3 min-w-0">
            <span className="truncate block">
              {(entity as Book).metadata?.publishers?.join(", ") || ""}
            </span>
          </div>
          <div className="flex-1 px-3 min-w-0">
            <span className="truncate block">
              {(entity as Book).metadata?.publish_date || ""}
            </span>
          </div>
        </>
      )}
      <div className="w-20 flex justify-end">
        <button
          className="bg-secondary px-2 py-1 rounded-lg text-sm text-white hover:bg-opacity-80 hover:cursor-pointer transition-colors"
          onClick={handleViewClick}
        >
          View
        </button>
      </div>
    </div>
  );
});

export default function VirtualizedLibraryTable({
  series,
  isLandscape,
  offline,
}: VirtualizedLibraryTableProps) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);
  const rowHeightCache = useRef<Map<number, number>>(new Map());

  const estimateRowHeight = useCallback(
    (index: number) => {
      const cached = rowHeightCache.current.get(index);
      if (cached) return cached;

      const entity = series[index];
      if (!entity) return 60;

      let height = 60;

      const titleLength = entity.title?.length || 0;
      if (titleLength > 50) height += 20;
      if (titleLength > 100) height += 20;

      if (isLandscape) {
        const book = entity as Book;
        if (
          book.metadata?.authors?.some(
            (author: string | { name: string }) =>
              (typeof author === "string" ? author : author.name || "").length >
              30
          )
        ) {
          height += 20;
        }
      }

      rowHeightCache.current.set(index, height);
      return height;
    },
    [series, isLandscape]
  );

  const rowVirtualizer = useVirtualizer({
    count: series.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowHeight,
    overscan: 8,
    measureElement: (el) => {
      const height = el.getBoundingClientRect().height;
      const index = parseInt(el.getAttribute("data-index") || "0", 10);
      rowHeightCache.current.set(index, height);
      return height;
    },
  });

  const headerColumns = useMemo(() => {
    const columns = [{ key: "title", label: t("library.tableHeaders.title") }];

    if (isLandscape) {
      columns.push(
        { key: "authors", label: t("library.tableHeaders.authors") },
        { key: "genres", label: t("library.tableHeaders.genres") },
        { key: "publishers", label: t("library.tableHeaders.publishers") },
        { key: "publishDate", label: t("library.tableHeaders.publishDate") }
      );
    }

    columns.push({ key: "actions", label: "" });
    return columns;
  }, [isLandscape, t]);

  return (
    <div className="w-full">
      <div className="bg-primary text-white text-sm sticky top-0 z-10 rounded-t-lg">
        <div className="flex items-center p-3">
          <div className="flex-1">{headerColumns[0].label}</div>
          {isLandscape &&
            headerColumns.slice(1, -1).map((column) => (
              <div key={column.key} className="flex-1 px-3">
                {column.label}
              </div>
            ))}
          <div className="w-20 text-right">
            {headerColumns[headerColumns.length - 1].label}
          </div>
        </div>
      </div>
      <div
        ref={parentRef}
        className="w-full virtual-container scroll-container"
        style={{
          height: "calc(100vh - 300px)",
          overflow: "auto",
          paddingBottom: "6rem",
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
          className="virtual-container"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const entity = series[virtualRow.index];
            if (!entity) return null;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="virtual-item virtual-table-row"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <VirtualTableRow
                  entity={entity}
                  isLandscape={isLandscape}
                  isEven={virtualRow.index % 2 === 0}
                  offline={offline}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
