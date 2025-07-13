import { useTranslation } from "react-i18next";

import { Series } from "../../../hooks/useManga";

export default function MangaInfo({ series }: { series: Series }) {
  const { t } = useTranslation();

  if (!series) {
    return null;
  }

  return (
    <div className="bg-primary rounded-xl p-3 mb-[1rem] text-white text-sm mt-[1rem] flex flex-col gap-1">
      {series.manga_data.published_from && (
        <div>
          <span className="font-bold">{t("series.publishedFrom")}:</span>{" "}
          {new Date(series.manga_data.published_from).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </div>
      )}
      {series.manga_data.published_to && (
        <div>
          <span className="font-bold">{t("series.publishedTo")}:</span>{" "}
          {new Date(series.manga_data.published_to).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          )}
        </div>
      )}
      {series.manga_data.total_volumes &&
        series.manga_data.total_volumes > 0 && (
          <div>
            <span className="font-bold">{t("series.volumes")}:</span>{" "}
            {series.manga_data.total_volumes}
          </div>
        )}
      {series.manga_data.total_chapters &&
        series.manga_data.total_chapters > 0 && (
          <div>
            <span className="font-bold">{t("series.chapters")}:</span>{" "}
            {series.manga_data.total_chapters}
          </div>
        )}
    </div>
  );
}
