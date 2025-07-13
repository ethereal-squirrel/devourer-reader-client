import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useParams } from "react-router";

import CollectionNav from "../components/molecules/library/CollectionNav";
import LibraryCard from "../components/molecules/library/LibraryCard";
import { Container } from "../components/templates/Container";
import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Book } from "../hooks/useBook";
import { Library } from "../hooks/useLibrary";
import { Series } from "../hooks/useManga";
import { useLibraryStore } from "../store/library";

export default function Collection() {
  const { id } = useParams();
  const { libraryData } = useLibraryStore(
    useShallow((state) => ({
      libraryId: state.libraryId,
      libraryData: state.libraryData,
    }))
  );
  const [collection, setCollection] = useState<any>(null);

  useEffect(() => {
    if (libraryData && id) {
      const collection = (libraryData as unknown as Library).collections?.find(
        (collection: any) => collection.id === Number(id)
      );

      if (collection) {
        setCollection(collection);
      }
    }
  }, [libraryData, id]);

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-24 pt-8">
        {!collection ? (
          <LoadingState />
        ) : (
          <>
            <div className="mt-[1rem]">
              <CollectionNav
                libraryId={(libraryData as unknown as Library).id}
                name={collection.name}
                collectionId={collection.id}
              />
            </div>
            <div className="mt-[1rem] grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-5 auto-rows-fr">
              {collection.series.map((entity: number, index: number) => (
                <LibraryCard
                  key={`collection-entity-card-${entity}-${index}-${
                    (libraryData as unknown as Library).id
                  }`}
                  entity={
                    (libraryData as unknown as Library)?.series.find(
                      (series: any) => series.id === entity
                    ) as Book | Series
                  }
                  offline={false}
                />
              ))}
            </div>
          </>
        )}
      </Container>
      <TabBar />
    </div>
  );
}
