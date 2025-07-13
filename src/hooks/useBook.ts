import { useState, useCallback } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import { useShallow } from "zustand/react/shallow";
import { toast } from "react-toastify";

import { Library } from "./useLibrary";
import { useEntityFilter } from "./useEntityFilter";
import { useImport } from "./useImport";
import { db } from "../lib/database";
import { useCommonStore } from "../store/common";
import { useLibraryStore } from "../store/library";

export interface Book {
  id: number;
  file_id: number;
  title: string;
  path: string;
  file_name: string;
  file_format: string;
  total_pages: number | null;
  current_page: string | number | null;
  is_read: boolean;
  library_id: number | null;
  metadata: any;
}

export function useBook() {
  const { addToQueue, removeBook } = useImport();
  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { libraryData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData as unknown as Library,
    }))
  );
  const [book, setBook] = useState<Book | null>(null);
  const [offlineAvailability, setOfflineAvailability] =
    useState<boolean>(false);

  const {
    filter: filterBook,
    setFilter: setFilterBook,
    filteredItems: filteredBookSeries,
  } = useEntityFilter<Book>((libraryData?.series || []) as Book[], {
    searchFields: [
      "title",
      (item: Book) => item.metadata?.original_title || "",
      (item: Book) => item.metadata?.epub?.title || "",
      (item: Book) => item.metadata?.authors || [],
    ],
    minCharacters: 3,
  });

  const retrieveBook = useCallback(
    async (bookId: number, local?: boolean) => {
      if (local) {
        const book = await retrieveLocalBook(bookId, server);

        setBook(book as Book);
        return book;
      } else {
        if (!libraryData) {
          return null;
        }

        const book =
          libraryData &&
          libraryData.series.find((series) => series.id === bookId);

        if (book) {
          if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile") {
            const existingBook = await db.select(
              "SELECT * FROM BookFile WHERE file_id = ? AND server = ?",
              [bookId, server]
            );

            if (existingBook && existingBook.length > 0) {
              setOfflineAvailability(true);
            } else {
              setOfflineAvailability(false);
            }
          }
          setBook(book as Book);
          return book;
        } else {
          setOfflineAvailability(false);
          setBook(null);
          return null;
        }
      }
    },
    [libraryData]
  );

  const retrieveLocalBook = useCallback(
    async (bookId: number, server: string) => {
      const existingBook = await db.select(
        "SELECT * FROM BookFile WHERE file_id = ? AND server = ?",
        [bookId, server]
      );

      if (existingBook && existingBook.length > 0) {
        const bookData = {
          ...existingBook[0],
          metadata: JSON.parse(existingBook[0].metadata),
        };

        setBook(bookData as Book);
        return bookData;
      } else {
        return null;
      }
    },
    [db]
  );

  const makeBookAvailableOffline = async (book: Book) => {
    const answer = await ask(
      "Are you sure you want to make this book available offline?",
      {
        title: "Devourer",
        kind: "info",
      }
    );

    if (answer) {
      const outcome = await addToQueue("book", book);

      if (outcome) {
        toast.success("Book added to queue.", {
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
          position: "bottom-right",
        });
      } else {
        toast.error("Failed to add book to queue.", {
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
          position: "bottom-right",
        });
      }
    }
  };

  const makeBookUnavailableOffline = async (book: {
    id: number;
    server: string;
  }) => {
    const answer = await ask(
      "Are you sure you want to remove this book from offline storage?",
      {
        title: "Devourer",
        kind: "warning",
      }
    );

    if (answer) {
      const outcome = await removeBook(book.id, book.server);

      if (outcome) {
        toast.success("Book removed from offline storage.", {
          position: "bottom-right",
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
        });
      } else {
        toast.error("Failed to remove book from offline storage.", {
          position: "bottom-right",
          style: {
            backgroundColor: "#111827",
            color: "#fff",
          },
        });
      }
    }
  };

  const searchGoogleMetadata = async (query: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}&printType=books&maxResults=25`
      );

      const data = await response.json();

      return data.items;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const selectGoogleResult = async (metadata: any, result: any) => {
    const data = {
      original_title: result.volumeInfo.title,
      epub: metadata.epub,
      title: result.volumeInfo.title || null,
      isbn_10:
        result.volumeInfo.industryIdentifiers.find(
          (identifier: { type: string; identifier: string }) =>
            identifier.type === "ISBN_10"
        )?.identifier || null,
      isbn_13:
        result.volumeInfo.industryIdentifiers.find(
          (identifier: { type: string; identifier: string }) =>
            identifier.type === "ISBN_13"
        )?.identifier || null,
      publish_date: result.volumeInfo.publishedDate,
      oclc_numbers: [],
      work_key: null,
      key: null,
      dewey_decimal_class: result.volumeInfo.dewey_decimal_class || null,
      description: result.volumeInfo.description || "No description available",
      authors: result.volumeInfo.authors || [],
      genres: result.volumeInfo.categories || [],
      publishers: result.volumeInfo.publishers
        ? result.volumeInfo.publishers
        : result.volumeInfo.publisher
        ? [result.volumeInfo.publisher]
        : [],
      identifiers: result.volumeInfo.industryIdentifiers || [],
      subtitle: result.volumeInfo.subtitle || null,
      number_of_pages: result.volumeInfo.pageCount || null,
      cover: result.volumeInfo.imageLinks?.thumbnail || null,
      subjects: result.volumeInfo.categories || [],
      provider: "google",
    };

    return data;
  };

  return {
    book,
    offlineAvailability,
    setOfflineAvailability,
    retrieveBook,
    retrieveLocalBook,
    filteredBookSeries,
    filterBook,
    setFilterBook,
    searchGoogleMetadata,
    selectGoogleResult,
    makeBookAvailableOffline,
    makeBookUnavailableOffline,
  };
}
