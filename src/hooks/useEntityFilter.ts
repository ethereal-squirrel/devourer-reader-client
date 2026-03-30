import { useState, useMemo, useCallback } from "react";

export type SortOption = "name_asc" | "name_desc" | "id_asc" | "id_desc";

export interface FilterConfig<T> {
  searchFields: (keyof T | ((item: T) => string | string[]))[];
  minCharacters?: number;
  caseSensitive?: boolean;
}

export interface UseEntityFilterResult<T> {
  filter: string;
  setFilter: (filter: string) => void;
  filterBy: string;
  setFilterBy: (filterBy: string) => void;
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  filteredItems: T[];
  clearFilter: () => void;
}

export function useEntityFilter<T>(
  items: T[],
  config: FilterConfig<T>
): UseEntityFilterResult<T> {
  const [filter, setFilter] = useState<string>("");
  const [filterBy, setFilterBy] = useState<string>("title");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const { searchFields, minCharacters = 3, caseSensitive = false } = config;

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }

    const sortItems = (arr: T[]) =>
      arr.sort((a, b) => {
        if (sortBy === "name_asc") {
          return ((a["title" as keyof T] as unknown as string) || "").localeCompare(
            (b["title" as keyof T] as unknown as string) || ""
          );
        } else if (sortBy === "name_desc") {
          return ((b["title" as keyof T] as unknown as string) || "").localeCompare(
            (a["title" as keyof T] as unknown as string) || ""
          );
        } else if (sortBy === "id_asc") {
          return ((a["id" as keyof T] as unknown as number) || 0) - ((b["id" as keyof T] as unknown as number) || 0);
        } else {
          return ((b["id" as keyof T] as unknown as number) || 0) - ((a["id" as keyof T] as unknown as number) || 0);
        }
      });

    if (filter.length < minCharacters) {
      return sortItems([...items]);
    }

    const searchTerm = caseSensitive ? filter : filter.toLowerCase();

    const filtered = items.filter((item) => {
      let searchValue: string | string[];

      if (filterBy === "title") {
        searchValue = (item["title" as keyof T] as unknown as string) || "";
      } else if (filterBy === "author") {
        const authorField = searchFields.find((field) => typeof field === "function");
        if (authorField && typeof authorField === "function") {
          searchValue = authorField(item);
        } else {
          searchValue = "";
        }
      } else if (filterBy === "genre") {
        const genreField = searchFields[2];
        if (genreField && typeof genreField === "function") {
          searchValue = genreField(item);
        } else {
          searchValue = "";
        }
      } else {
        return searchFields.some((field) => {
          let fieldValue: string | string[];

          if (typeof field === "function") {
            fieldValue = field(item);
          } else {
            fieldValue = (item[field] as unknown as string) || "";
          }

          if (Array.isArray(fieldValue)) {
            return fieldValue.some((value) => {
              const stringValue =
                typeof value === "string"
                  ? value
                  : typeof value === "object" && value !== null && "name" in value
                  ? (value as { name: string }).name || ""
                  : "";

              const processedValue = caseSensitive
                ? stringValue
                : stringValue.toLowerCase();
              return processedValue.includes(searchTerm);
            });
          }

          const processedValue = caseSensitive
            ? fieldValue
            : fieldValue.toLowerCase();
          return processedValue.includes(searchTerm);
        });
      }

      if (Array.isArray(searchValue)) {
        return searchValue.some((value) => {
          const stringValue =
            typeof value === "string"
              ? value
              : typeof value === "object" && value !== null && "name" in value
              ? (value as { name: string }).name || ""
              : "";

          const processedValue = caseSensitive
            ? stringValue
            : stringValue.toLowerCase();
          return processedValue.includes(searchTerm);
        });
      }

      const processedValue = caseSensitive
        ? searchValue
        : searchValue.toLowerCase();
      return processedValue.includes(searchTerm);
    });

    return sortItems(filtered);
  }, [items, filter, filterBy, sortBy, searchFields, minCharacters, caseSensitive]);

  const clearFilter = useCallback(() => {
    setFilter("");
  }, []);

  return {
    filter,
    setFilter,
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
    filteredItems,
    clearFilter,
  };
}
