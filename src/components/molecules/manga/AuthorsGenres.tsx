import { useTranslation } from "react-i18next";

import { Series } from "../../../hooks/useManga";

export default function AuthorsGenres({ series }: { series: Series }) {
  const { t } = useTranslation();

  if (!series) {
    return null;
  }

  return (
    <div className="text-sm mb-[1rem] bg-primary rounded-xl p-3 text-white mt-[1rem] flex flex-col gap-1">
      {series.manga_data.authors && series.manga_data.authors.length > 0 && (
        <div>
          <span className="font-bold">{t("series.authors")}:</span>{" "}
          {series.manga_data.authors?.join(", ")}
        </div>
      )}
      {series.manga_data.genres && series.manga_data.genres.length > 0 && (
        <div>
          <span className="font-bold">{t("series.genres")}:</span>{" "}
          {series.manga_data.genres?.join(", ")}
        </div>
      )}
    </div>
  );
}
