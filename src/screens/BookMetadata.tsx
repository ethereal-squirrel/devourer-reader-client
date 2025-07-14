import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";

import Button from "../components/atoms/Button";
import SearchGoogleModal from "../components/organisms/book/SearchGoogleModal";
import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { Book, useBook } from "../hooks/useBook";
import { useLibrary } from "../hooks/useLibrary";
import { useShared } from "../hooks/useShared";
import { useLibraryStore } from "../store/library";

export default function BookMetadataScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLocal = searchParams.get("isLocal") === "true";
  const { book, retrieveBook } = useBook();
  const { updateMetadata } = useShared();
  const navigate = useNavigate();
  const { retrieveLibraries } = useLibrary();
  const { libraryId } = useLibraryStore(
    useShallow((state) => ({
      libraryId: state.libraryId,
    }))
  );

  const [displayGoogleModal, setDisplayGoogleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<Book>({} as Book);

  useEffect(() => {
    if (isLocal) {
      //
    } else {
      if (id) {
        retrieve(id);
      }
    }
  }, [id, retrieveBook, isLocal]);

  const retrieve = async (id: string) => {
    const book = await retrieveBook(Number(id));
    setPayload(book);
  };

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-[8rem] pt-8">
        {!payload || !book || !libraryId ? (
          <LoadingState />
        ) : (
          <>
            <div className="mt-[1rem]">
              <div className="flex flex-col md:flex-row md:justify-between items-center mb-[1rem] gap-3">
                <Button
                  className="w-full md:w-auto"
                  onPress={() => {
                    if (isLocal) {
                      navigate(`/book/${book.id}?isLocal=true`);
                    } else {
                      navigate(`/book/${book.id}`);
                    }
                  }}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  {t("common.returnToBook")}
                </Button>
                <Button
                  className="w-full md:w-auto"
                  onPress={() => {
                    setDisplayGoogleModal(true);
                  }}
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  {t("common.searchForMetadata")}
                </Button>
              </div>
              <div className="bg-primary rounded-xl p-3 text-white mb-[1rem]">
                <span className="font-semibold">File name:</span>{" "}
                {book.file_name}
              </div>
              <div className="bg-primary rounded-xl p-3 text-white">
                {book.file_format === "epub" && (
                  <div>
                    <label htmlFor="epubTitle" className="font-semibold">
                      ePub Title
                    </label>
                    <input
                      id="epubTitle"
                      type="text"
                      value={payload.metadata?.epub?.title || ""}
                      onChange={(e) => {
                        setPayload({
                          ...payload,
                          metadata: {
                            ...payload.metadata,
                            epub: {
                              ...payload.metadata.epub,
                              title: e.target.value,
                            },
                          },
                        });
                      }}
                      className="w-full p-2 mt-2 rounded-md border border-gray-300"
                    />
                  </div>
                )}
                <div className="mt-2">
                  <label htmlFor="title" className="font-semibold">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={
                      payload.metadata?.title
                        ? payload.metadata.title
                        : payload.title || ""
                    }
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          title: e.target.value,
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="subtitle" className="font-semibold">
                    Subtitle
                  </label>
                  <input
                    id="subtitle"
                    type="text"
                    value={payload.metadata?.subtitle || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          subtitle: e.target.value,
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="authors" className="font-semibold">
                    Authors{" "}
                    <span className="text-xs">(separated by comma)</span>
                  </label>
                  <input
                    id="authors"
                    type="text"
                    value={payload.metadata?.authors?.join(", ") || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          authors: e.target.value
                            .split(",")
                            .map((author: string) => author.trim()),
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="genres" className="font-semibold">
                    Genres <span className="text-xs">(separated by comma)</span>
                  </label>
                  <input
                    id="genres"
                    type="text"
                    value={payload.metadata?.genres?.join(", ") || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          genres: e.target.value
                            .split(",")
                            .map((genre: string) => genre.trim()),
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="publishers" className="font-semibold">
                    Publishers{" "}
                    <span className="text-xs">(separated by comma)</span>
                  </label>
                  <input
                    id="publishers"
                    type="text"
                    value={payload.metadata?.publishers?.join(", ") || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          publishers: e.target.value
                            .split(",")
                            .map((publisher: string) => publisher.trim()),
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="publishDate" className="font-semibold">
                    Publish date
                  </label>
                  <input
                    id="publishDate"
                    type="text"
                    value={payload.metadata?.publish_date || ""}
                    onChange={(e) => {
                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          publish_date: e.target.value,
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="isbn13" className="font-semibold">
                    ISBN 13
                  </label>
                  <input
                    id="isbn13"
                    type="text"
                    value={
                      payload.metadata?.identifiers?.find(
                        (identifier: { type: string; identifier: string }) =>
                          identifier.type === "ISBN_13"
                      )?.identifier
                    }
                    onChange={(e) => {
                      const identifiers = payload.metadata?.identifiers?.filter(
                        (identifier: { type: string; identifier: string }) =>
                          identifier.type !== "ISBN_13"
                      );

                      identifiers.push({
                        type: "ISBN_13",
                        identifier: e.target.value,
                      });

                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          identifiers,
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
                <div className="mt-2">
                  <label htmlFor="isbn10" className="font-semibold">
                    ISBN 10
                  </label>
                  <input
                    id="isbn10"
                    type="text"
                    value={
                      payload.metadata?.identifiers?.find(
                        (identifier: { type: string; identifier: string }) =>
                          identifier.type === "ISBN_10"
                      )?.identifier
                    }
                    onChange={(e) => {
                      const identifiers = payload.metadata?.identifiers?.filter(
                        (identifier: { type: string; identifier: string }) =>
                          identifier.type !== "ISBN_10"
                      );

                      identifiers.push({
                        type: "ISBN_10",
                        identifier: e.target.value,
                      });

                      setPayload({
                        ...payload,
                        metadata: {
                          ...payload.metadata,
                          identifiers,
                        },
                      });
                    }}
                    className="w-full p-2 mt-2 rounded-md border border-gray-300"
                  />
                </div>
              </div>
              <div className="mt-[1rem] mb-[3rem]">
                <Button
                  onPress={async () => {
                    if (loading) {
                      return;
                    }

                    setLoading(true);

                    const outcome = await updateMetadata(
                      libraryId,
                      book.id,
                      payload.metadata
                    );

                    if (outcome) {
                      retrieveLibraries();
                    }

                    setLoading(false);
                  }}
                  disabled={loading}
                  className="w-full md:text-lg"
                >
                  {t("common.saveChanges")}
                </Button>
              </div>
            </div>
          </>
        )}
      </Container>
      {book && (
        <SearchGoogleModal
          book={book}
          displayGoogle={displayGoogleModal}
          setDisplayGoogle={setDisplayGoogleModal}
        />
      )}
      <TabBar />
    </div>
  );
}
