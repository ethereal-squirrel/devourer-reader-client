import { useState, useMemo, useCallback } from "react";

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
  filteredItems: T[];
  clearFilter: () => void;
}

export function useEntityFilter<T>(
  items: T[],
  config: FilterConfig<T>
): UseEntityFilterResult<T> {
  const [filter, setFilter] = useState<string>("");
  const [filterBy, setFilterBy] = useState<string>("title");
  const { searchFields, minCharacters = 3, caseSensitive = false } = config;

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }

    if (filter.length < minCharacters) {
      return [...items];
    }

    const searchTerm = caseSensitive ? filter : filter.toLowerCase();

    return items.filter((item) => {
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
  }, [items, filter, filterBy, searchFields, minCharacters, caseSensitive]);

  const clearFilter = useCallback(() => {
    setFilter("");
  }, []);

  return {
    filter,
    setFilter,
    filterBy,
    setFilterBy,
    filteredItems,
    clearFilter,
  };
}
