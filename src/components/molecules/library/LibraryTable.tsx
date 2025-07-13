import { useTranslation } from "react-i18next";

import LibraryRow from "./LibraryRow";
import { Book } from "../../../hooks/useBook";
import { Series } from "../../../hooks/useManga";

export default function LibraryTable({
  series,
  isLandscape,
  offline,
}: {
  series: Book[] | Series[];
  isLandscape: boolean;
  offline?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <table className="w-full text-sm [&>tbody>*:nth-child(odd)]:bg-input [&>tbody>*:nth-child(even)]:bg-primary text-white rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-primary text-left">
          <th className="p-3">{t("library.tableHeaders.title")}</th>
          {isLandscape ? (
            <>
              <th className="p-3">{t("library.tableHeaders.authors")}</th>
              <th className="p-3">{t("library.tableHeaders.genres")}</th>
              <th className="p-3">{t("library.tableHeaders.publishers")}</th>
              <th className="p-3">{t("library.tableHeaders.publishDate")}</th>
            </>
          ) : null}
          <th className="p-3 text-right">&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        {series.map((entity: Book | Series) => (
          <LibraryRow
            key={entity.id}
            entity={entity}
            isLandscape={isLandscape}
            offline={offline}
          />
        ))}
      </tbody>
    </table>
  );
}
