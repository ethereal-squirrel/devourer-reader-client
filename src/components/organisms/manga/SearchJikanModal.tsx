import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { retrieveMetadataResults } from "@devourer-reader/shared";
import { XMarkIcon } from "@heroicons/react/24/solid";

import Button from "../../atoms/Button";
import { useLibrary } from "../../../hooks/useLibrary";
import { Series } from "../../../hooks/useManga";
import { useShared } from "../../../hooks/useShared";
import { useLibraryStore } from "../../../store/library";

export default function SearchJikanModal({
  series,
  displayJikan,
  setDisplayJikan,
}: {
  series: Series;
  displayJikan: boolean;
  setDisplayJikan: (displayJikan: boolean) => void;
}) {
  const { libraryId } = useLibraryStore(
    useShallow((state) => ({
      libraryId: state.libraryId,
    }))
  );
  const { retrieveLibrary } = useLibrary();
  const { updateMetadata } = useShared();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [jikanSearch, setJikanSearch] = useState(series.title || "");

  const searchJikan = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    const results = await retrieveMetadataResults(
      "myanimelist",
      "title",
      jikanSearch
    );

    if (results) {
      setResults(results);
    } else {
      setResults([]);
    }

    setLoading(false);
  };

  const handleResultSelect = async (result: any) => {
    if (loading) {
      return;
    }

    setLoading(true);

    await updateMetadata(libraryId || 0, series.id, result);
    await retrieveLibrary(libraryId || 0);

    setLoading(false);
    setDisplayJikan(false);
  };

  return (
    <Dialog
      open={displayJikan}
      as="div"
      className="relative z-10 focus:outline-none"
      onClose={() => setDisplayJikan(false)}
    >
      <div className="fixed inset-0 z-10 w-screen mt-[2rem] overflow-y-auto bg-black/85">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-6xl rounded-xl bg-gray-900 text-white p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <DialogTitle as="h3" className="font-semibold text-2xl">
                Search MyAnimeList
              </DialogTitle>
              <div className="flex items-center justify-center">
                <button
                  className="bg-secondary p-3 rounded-full text-white hover:cursor-pointer"
                  onClick={() => setDisplayJikan(false)}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="mt-5">
              <label htmlFor="name" className="font-semibold">
                Query
              </label>
              <input
                type="text"
                id="name"
                className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                value={jikanSearch}
                onChange={(e) => setJikanSearch(e.target.value)}
              />
            </div>
            <div className="mt-5">
              <Button
                className="md:w-full"
                onPress={searchJikan}
                disabled={loading}
                aria-busy={loading}
              >
                Search
              </Button>
            </div>
            {results.length > 0 && (
              <div className="mt-5">
                <table className="w-full text-sm [&>tbody>*:nth-child(odd)]:bg-input [&>tbody>*:nth-child(even)]:bg-primary text-white rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-primary text-left">
                      <th className="p-3">Cover</th>
                      <th className="p-3">Title</th>
                      <th className="p-3 text-right">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result: any) => (
                      <tr key={result.id}>
                        <td className="p-3">
                          {result.coverImage && (
                            <img
                              src={result.coverImage}
                              alt={result.title}
                              className="h-[12rem] object-contain rounded-lg aspect-square"
                            />
                          )}
                        </td>
                        <td className="p-3">
                          {result.titles &&
                          result.titles.find(
                            (title: any) => title.type === "English"
                          )?.title
                            ? result.titles.find(
                                (title: any) => title.type === "English"
                              )?.title
                            : result.title}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            className="ml-auto mr-0 text-xs"
                            onPress={() => {
                              handleResultSelect(result);
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
