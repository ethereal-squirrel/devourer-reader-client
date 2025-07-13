import { memo } from "react";
import { useNavigate } from "react-router";

import { useLibrary } from "../../../hooks/useLibrary";
import { Book } from "../../../hooks/useBook";
import { Series } from "../../../hooks/useManga";

const LibraryRow = memo(function LibraryRow({
  entity,
  isLandscape,
  offline,
}: {
  entity: Book | Series;
  isLandscape: boolean;
  offline?: boolean;
}) {
  const navigate = useNavigate();
  const { library } = useLibrary();

  if (!library) {
    return null;
  }

  return (
    <tr
      key={entity.id}
      className="hover:cursor-pointer"
      onClick={() => {
        navigate(`/book/${library?.id}/${entity.id}`);
      }}
    >
      <td className="p-3">
        <div className="flex flex-row items-center gap-2">
          {library.type === "book" ? (
            <>
              {(entity as Book).metadata.epub &&
              (entity as Book).metadata.epub.title &&
              (entity as Book).metadata.epub.title.length > 0
                ? (entity as Book).metadata.epub.title
                : (entity as Book).metadata.original_title}
            </>
          ) : (
            <></>
          )}
          {library.type === "book" && (entity as Book).is_read && (
            <div className="bg-black/50 text-white p-1 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          )}
        </div>
      </td>
      {isLandscape ? (
        <>
          {library.type === "book" ? (
            <>
              <td className="p-3">
                {(entity as Book).metadata.authors?.join(", ")}
              </td>
              <td className="p-3">
                {(entity as Book).metadata.genres?.join(", ")}
              </td>
              <td className="p-3">
                {(entity as Book).metadata.publishers?.join(", ")}
              </td>
              <td className="p-3">{(entity as Book).metadata.publish_date}</td>
            </>
          ) : (
            <></>
          )}
        </>
      ) : null}
      <td className="p-3 text-right">
        <button
          className="bg-secondary px-2 py-1 rounded-lg text-sm text-white hover:cursor-pointer"
          onClick={() => {
            if (!library) return;

            const path =
              library.type === "manga"
                ? `/manga/${
                    offline ? (entity as Series).series_id : entity.id
                  }${
                    offline
                      ? `?isLocal=true&server=${
                          (entity as (Book | Series) & { server: string })
                            .server
                        }`
                      : ""
                  }`
                : `/book/${offline ? (entity as Book).file_id : entity.id}${
                    offline
                      ? `?isLocal=true&server=${
                          (entity as (Book | Series) & { server: string })
                            .server
                        }`
                      : ""
                  }`;

            navigate(path);
          }}
        >
          View
        </button>
      </td>
    </tr>
  );
});

export default LibraryRow;
