import { Book } from "../../../hooks/useBook";

export default function BookDescription({ book }: { book: Book }) {
  if (!book) {
    return null;
  }

  return (
    <div className="text-sm mb-[1rem] bg-primary rounded-xl p-3 text-white">
      {book.metadata.description && book.metadata.description.length > 0
        ? book.metadata.description
        : "No description available."}
    </div>
  );
}
