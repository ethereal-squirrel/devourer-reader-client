import React, {
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useShallow } from "zustand/react/shallow";

import LibraryCard from "../molecules/library/LibraryCard";
import { Book } from "../../hooks/useBook";
import { useImagePreloader } from "../../hooks/useImagePreloader";
import { useLibrary } from "../../hooks/useLibrary";
import { Series } from "../../hooks/useManga";
import { useCommonStore } from "../../store/common";

interface VirtualizedLibraryGridProps {
  items: (Book | Series)[];
  offline?: boolean;
}

const VirtualGridRow = React.memo(function VirtualGridRow({
  items,
  columnCount,
  offline,
}: {
  items: (Book | Series)[];
  columnCount: number;
  offline?: boolean;
}) {
  return (
    <div
      className="grid gap-5 px-1 w-full virtual-grid-row"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        marginBottom: "16px",
      }}
    >
      {items.map((entity) => (
        <LibraryCard key={entity.id} entity={entity} offline={offline} />
      ))}
    </div>
  );
});

export default function VirtualizedLibraryGrid({
  items,
  offline = false,
}: VirtualizedLibraryGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(() => {
    const width = window.innerWidth;
    if (width >= 1536) return 8;
    else if (width >= 1024) return 6;
    else if (width >= 768) return 4;
    return 1;
  });
  const rowHeightCache = useRef<Map<number, number>>(new Map());

  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { library } = useLibrary();

  const updateColumnCount = useCallback(() => {
    const width = window.innerWidth;
    let newColumnCount = 1;
    if (width >= 1536) newColumnCount = 8;
    else if (width >= 1024) newColumnCount = 6;
    else if (width >= 768) newColumnCount = 4;

    if (newColumnCount !== columnCount) {
      setColumnCount(newColumnCount);
      rowHeightCache.current.clear();
    }
  }, [columnCount]);

  useEffect(() => {
    updateColumnCount();

    const handleResize = () => {
      updateColumnCount();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateColumnCount]);

  const rowData = useMemo(() => {
    const rows: (Book | Series)[][] = [];
    for (let i = 0; i < items.length; i += columnCount) {
      rows.push(items.slice(i, i + columnCount));
    }
    return rows;
  }, [items, columnCount]);

  const estimateRowHeight = useCallback(
    (index: number) => {
      const cached = rowHeightCache.current.get(index);
      if (cached) return cached;

      const baseHeight = 300;

      const rowItems = rowData[index];
      if (!rowItems?.length) return baseHeight;

      const extraHeight = rowItems.reduce((acc, item) => {
        const titleLength = item.title?.length || 0;
        if (titleLength > 100) return acc + 40;
        if (titleLength > 50) return acc + 20;
        return acc;
      }, 0);

      const estimatedHeight = baseHeight + extraHeight;
      rowHeightCache.current.set(index, estimatedHeight);
      return estimatedHeight;
    },
    [rowData]
  );

  const rowVirtualizer = useVirtualizer({
    count: rowData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateRowHeight,
    overscan: 3,
    measureElement: (el) => {
      const height = el.getBoundingClientRect().height;
      const index = parseInt(el.getAttribute("data-index") || "0", 10);
      rowHeightCache.current.set(index, height);
      return height;
    },
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const { visibleStartIndex, visibleEndIndex } = useMemo(() => {
    const firstVirtualIndex = virtualItems[0]?.index || 0;
    const lastVirtualIndex = virtualItems[virtualItems.length - 1]?.index || 0;

    return {
      visibleStartIndex: Math.max(
        0,
        firstVirtualIndex * columnCount - columnCount * 3
      ),
      visibleEndIndex: Math.min(
        items.length,
        (lastVirtualIndex + 1) * columnCount + columnCount * 3
      ),
    };
  }, [virtualItems, columnCount, items.length]);

  useImagePreloader({
    items,
    server: server || "",
    libraryId: library?.id || 0,
    startIndex: visibleStartIndex,
    endIndex: visibleEndIndex,
    offline,
  });

  return (
    <div
      ref={parentRef}
      className="w-full virtual-container scroll-container"
      style={{
        height: "calc(100vh - 200px)",
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
          const rowItems = rowData[virtualRow.index];
          if (!rowItems) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="virtual-item virtual-grid-row"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <VirtualGridRow
                items={rowItems}
                columnCount={columnCount}
                offline={offline}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
