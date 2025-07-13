import { Series } from "../../../hooks/useManga";

export default function MangaTitles({ series }: { series: Series }) {
  if (!series) {
    return null;
  }

  if (
    !series.manga_data ||
    !series.manga_data.titles ||
    series.manga_data.titles.length === 0
  ) {
    return null;
  }

  return (
    <div className="bg-primary rounded-xl p-3 mb-[1rem] text-white text-sm mt-[1rem] flex flex-col gap-1">
      {series.manga_data.titles.map(
        (title: { type: string; title: string }) => (
          <div>
            {title.type !== "Default" && (
              <div>
                <span className="font-bold">{title.type}:</span>{" "}
                {title.title}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
