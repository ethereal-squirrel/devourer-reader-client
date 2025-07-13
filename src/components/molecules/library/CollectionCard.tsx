import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "react-router";

import { Library } from "../../../hooks/useLibrary";
import { useCommonStore } from "../../../store/common";
import { useLibraryStore } from "../../../store/library";

export default function CollectionCard({ collection }: { collection: any }) {
  const navigate = useNavigate();

  const { server } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
    }))
  );
  const { libraryData } = useLibraryStore(
    useShallow((state) => ({
      libraryData: state.libraryData as unknown as Library,
    }))
  );

  return (
    <button
      key={collection.id}
      className="bg-primary text-white rounded-xl hover:cursor-pointer flex flex-col items-center justify-start"
      onClick={() => {
        navigate(`/collection/${collection.id}`);
      }}
    >
      <div className="h-[16rem] w-full relative overflow-hidden">
        {collection.series.length > 0 && (
          <img
            src={`${server}/cover-image/${libraryData.id}/${collection.series[0]}.webp`}
            alt={collection.name}
            className="w-full h-full object-cover rounded-t-xl"
          />
        )}
      </div>
      <div className="text-sm p-3 text-center">{collection.name}</div>
    </button>
  );
}
