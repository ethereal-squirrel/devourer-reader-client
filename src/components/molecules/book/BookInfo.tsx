import { useTranslation } from "react-i18next";

import { Book } from "../../../hooks/useBook";

export default function BookInfo({ book }: { book: Book }) {
  const { t } = useTranslation();

  if (!book) {
    return null;
  }

  return (
    <>
      <div className="text-sm mb-[1rem] bg-primary rounded-xl p-3 text-white mt-[1rem]">
        <div>
          <span className="font-bold">{t("book.authors")}:</span>{" "}
          {book.metadata.authors?.join(", ")}
        </div>
        <div>
          <span className="font-bold">{t("book.genres")}:</span>{" "}
          {book.metadata.genres?.join(", ")}
        </div>
      </div>
      <div className="bg-primary rounded-xl p-3 text-white text-sm">
        {book.metadata.publishers && (
          <div>
            <span className="font-bold">{t("book.publisher")}:</span>{" "}
            {book.metadata.publishers.join(", ")}
          </div>
        )}
        {book.metadata.publish_date && (
          <div>
            <span className="font-bold">{t("book.published")}:</span>{" "}
            {book.metadata.publish_date}
          </div>
        )}
        {(() => {
          const isbn13FromIdentifiers = book.metadata.identifiers?.find(
            (identifier: { type: string; identifier: string }) =>
              identifier.type === "ISBN_13"
          )?.identifier;

          const isbn13 = isbn13FromIdentifiers || book.metadata.isbn_13;

          return isbn13 && isbn13.length > 0 ? (
            <div>
              <span className="font-bold">{t("book.isbn")}:</span> {isbn13}
            </div>
          ) : null;
        })()}
        {book.metadata.number_of_pages && book.metadata.number_of_pages > 0 && (
          <div>
            <span className="font-bold">{t("book.pages")}:</span>{" "}
            {book.metadata.number_of_pages}
          </div>
        )}
      </div>
    </>
  );
}
