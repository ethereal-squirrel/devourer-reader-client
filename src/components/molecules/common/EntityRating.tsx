import { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";

import { Book } from "../../../hooks/useBook";
import { Series } from "../../../hooks/useManga";
import { useShared } from "../../../hooks/useShared";

export default function EntityRating({
  series,
  retrieveSeries,
}: {
  series: Series | Book;
  retrieveSeries: () => void;
}) {
  const [currentHover, setCurrentHover] = useState<number | null>(null);
  const { rateEntity } = useShared();

  if (!series) {
    return null;
  }

  return (
    <div className="flex flex-row justify-between mb-[1rem]">
      {[1, 2, 3, 4, 5].map((rating) => (
        <div key={rating}>
          <button
            onClick={async () => {
              const outcome = await rateEntity(
                series.library_id || 0,
                series.id,
                rating
              );

              if (outcome) {
                retrieveSeries();
              }
            }}
            onMouseEnter={() => setCurrentHover(rating)}
            onMouseLeave={() => setCurrentHover(null)}
          >
            <StarIcon
              className={`w-8 h-8 cursor-pointer ${
                currentHover !== null && rating <= currentHover
                  ? "text-yellow-800"
                  : series.rating && rating <= (series.rating || 0)
                  ? "text-yellow-500"
                  : "text-gray-600"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
