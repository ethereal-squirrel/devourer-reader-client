import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { PencilIcon } from "@heroicons/react/24/solid";

import Button from "../components/atoms/Button";
import BookDescription from "../components/molecules/book/BookDescription";
import BookInfo from "../components/molecules/book/BookInfo";
import EntityNav from "../components/molecules/common/EntityNav";
import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { useBook, Book } from "../hooks/useBook";
import { useImageLoader } from "../hooks/useImageLoader";
import { useLibraryStore } from "../store/library";

export default function BookScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isLocal = searchParams.get("isLocal") === "true";
  const localServer = searchParams.get("server");
  const { book, offlineAvailability, retrieveBook, retrieveLocalBook } =
    useBook();
  const navigate = useNavigate();
  const { libraryId } = useLibraryStore(
    useShallow((state) => ({
      libraryId: state.libraryId,
    }))
  );

  const shouldLoadImage =
    book && (isLocal || (libraryId !== null && libraryId !== undefined));

  const { imagePath, isLoading: imageLoading } = useImageLoader({
    type: "book",
    entity: book || ({ id: -1, file_id: -1 } as Book),
    libraryId: libraryId || 0,
    offline: isLocal,
  });

  useEffect(() => {
    if (isLocal) {
      retrieveLocalBook(Number(id), localServer || "");
    } else {
      if (id) {
        retrieveBook(Number(id));
      }
    }
  }, [id, retrieveBook, retrieveLocalBook, isLocal, localServer]);

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-24 pt-8">
        {!book ? (
          <LoadingState />
        ) : (
          <>
            <div className="mt-[1rem]">
              <EntityNav
                type="book"
                entity={book}
                libraryId={libraryId || 0}
                offlineAvailability={offlineAvailability}
                isLocal={isLocal}
                localServer={localServer || undefined}
              />
              <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <div className="mb-[1rem]">
                    {!shouldLoadImage || imageLoading ? (
                      <div className="w-full h-64 bg-gray-300 rounded-xl animate-pulse flex items-center justify-center">
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <img
                        src={imagePath || ""}
                        alt="Book cover"
                        className="w-full h-auto rounded-xl"
                      />
                    )}
                  </div>
                  <BookInfo book={book} />
                </div>
                <div className="w-full md:col-span-3">
                  <BookDescription book={book} />
                  <div className="mb-[1rem]">
                    <Button
                      onPress={() => {
                        navigate(
                          isLocal
                            ? `/book/${id}/read?isLocal=true&server=${localServer}`
                            : `/book/${id}/read`
                        );
                      }}
                      className="w-full md:text-lg"
                    >
                      <PencilIcon className="w-4 h-4" />
                      {t("book.readNow")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Container>
      <TabBar />
    </div>
  );
}
