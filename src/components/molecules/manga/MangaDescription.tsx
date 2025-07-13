import { useState } from "react";

import { Series } from "../../../hooks/useManga";

export default function MangaDescription({ series }: { series: Series }) {
  const [isClamped, setIsClamped] = useState(true);

  if (!series) {
    return null;
  }

  return (
    <div className="text-sm mb-[1rem] bg-primary rounded-xl p-3 text-white">
      <div className={`${isClamped ? "line-clamp-4" : "line-clamp-none"}`}>
        {series.manga_data.synopsis && series.manga_data.synopsis.length > 0
          ? series.manga_data.synopsis
          : "No description available."}
      </div>
      <button
        className="text-xs text-gray-200 mt-[1rem] hover:cursor-pointer"
        onClick={() => setIsClamped(!isClamped)}
      >
        {isClamped ? "Read more" : "Read less"}
      </button>
    </div>
  );
}
