import { useState, useMemo, useCallback } from "react";

export interface FilterConfig<T> {
  searchFields: (keyof T | ((item: T) => string | string[]))[];
  minCharacters?: number;
  caseSensitive?: boolean;
}

export interface UseEntityFilterResult<T> {
  filter: string;
  setFilter: (filter: string) => void;
  filteredItems: T[];
  clearFilter: () => void;
}

export function useEntityFilter<T>(
  items: T[],
  config: FilterConfig<T>
): UseEntityFilterResult<T> {
  const [filter, setFilter] = useState<string>("");
  
  const {
    searchFields,
    minCharacters = 3,
    caseSensitive = false,
  } = config;

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }

    if (filter.length < minCharacters) {
      return [...items];
    }

    const searchTerm = caseSensitive ? filter : filter.toLowerCase();

    return items.filter((item) => {
      return searchFields.some((field) => {
        let searchValue: string | string[];

        if (typeof field === "function") {
          searchValue = field(item);
        } else {
          searchValue = (item[field] as unknown as string) || "";
        }

        if (Array.isArray(searchValue)) {
          return searchValue.some((value) => {
            const stringValue = typeof value === "string" 
              ? value 
              : typeof value === "object" && value !== null && "name" in value
                ? (value as { name: string }).name || ""
                : "";
            
            const processedValue = caseSensitive ? stringValue : stringValue.toLowerCase();
            return processedValue.includes(searchTerm);
          });
        }

        const processedValue = caseSensitive ? searchValue : searchValue.toLowerCase();
        return processedValue.includes(searchTerm);
      });
    });
  }, [items, filter, searchFields, minCharacters, caseSensitive]);

  const clearFilter = useCallback(() => {
    setFilter("");
  }, []);

  return {
    filter,
    setFilter,
    filteredItems,
    clearFilter,
  };
}