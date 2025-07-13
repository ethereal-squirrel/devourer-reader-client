import { memo, useCallback, useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";

import { useOpdsStore } from "../../../store/opds";

const OpdsCard = memo(
  function OpdsCard({ entity }: { entity: any }) {
    const navigate = useNavigate();
    const { opdsUrl } = useOpdsStore(
      useShallow((state) => ({
        opdsUrl: state.opdsUrl,
      }))
    );
    const [book, setBook] = useState<any | null>(null);

    const handleClick = useCallback(() => {
      const acquisition = entity.links.find(
        (link: any) => link.rel === "http://opds-spec.org/acquisition"
      );

      if (!acquisition) {
        return false;
      }

      const path = `/book/0/read?opdsType=${
        acquisition.type === "application/pdf" ? "opds-pdf" : "opds-epub"
      }&opdsUrl=${encodeURIComponent(acquisition.href)}`;

      navigate(path);
    }, [entity.id, navigate]);

    const displayTitle = useMemo(() => {
      return entity.title;
    }, [entity]);

    useEffect(() => {
      if (!opdsUrl) {
        return;
      }

      let book = { ...entity };

      const imageLink = entity.links.find(
        (link: any) => link.rel === "http://opds-spec.org/image"
      );

      if (imageLink) {
        book.image = new URL(imageLink.href, opdsUrl).toString();
      }

      const fileLink = entity.links.find(
        (link: any) => link.rel === "http://opds-spec.org/acquisition"
      );

      if (fileLink) {
        book.file = new URL(fileLink.href, opdsUrl).toString();
      }

      setBook(book);
    }, [entity, opdsUrl]);

    if (!book) {
      return null;
    }

    return (
      <button
        className="bg-primary text-white rounded-xl flex flex-col hover:cursor-pointer h-full transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={displayTitle}
        onClick={handleClick}
        style={{
          contain: "layout style paint",
        }}
      >
        <div className="h-[16rem] relative overflow-hidden">
          <img
            src={book.image || ""}
            alt={book.title}
            className="w-full h-full object-cover rounded-t-xl"
            style={{
              transition: "opacity 0.2s ease-in-out",
            }}
          />
        </div>
        <div className="text-sm p-3 flex-1 flex items-center justify-center">
          <span className="line-clamp-3 text-center leading-relaxed">
            {displayTitle}
          </span>
        </div>
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.entity.id === nextProps.entity.id &&
      prevProps.entity.title === nextProps.entity.title
    );
  }
);

export default OpdsCard;
