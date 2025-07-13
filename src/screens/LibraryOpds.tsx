import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import Button from "../components/atoms/Button";
import OpdsCard from "../components/molecules/library/OpdsCard";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { useOpds } from "../hooks/useOpds";
import { useOpdsStore } from "../store/opds";

export default function LibraryOpds() {
  const { opdsBooks, nextLink, prevLink } = useOpdsStore(
    useShallow((state) => ({
      opdsBooks: state.opdsBooks,
      nextLink: state.nextLink,
      prevLink: state.prevLink,
    }))
  );
  const { getBooksByPage } = useOpds();
  // @ts-ignore
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    setIsLandscape(mediaQuery.matches);

    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
    };

    mediaQuery.addEventListener("change", handleOrientationChange);

    return () => {
      mediaQuery.removeEventListener("change", handleOrientationChange);
    };
  }, []);
  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className={`${!opdsBooks ? "flex-1" : ""} px-5 pt-8`}>
        <div className="flex flex-col items-center justify-center h-full w-full">
          {!opdsBooks ? (
            <div>Loading...</div>
          ) : (
            <div className="w-full">
              {/*<Actions activeTab={activeTab} setActiveTab={setActiveTab} />*/}
              {/*activeTab === "files" && (
                <div className="mt-5">
                  <Filter
                    filter={library.type === "book" ? filterBook : filterManga}
                    setFilter={
                      library.type === "book" ? setFilterBook : setFilterManga
                    }
                    placeholder={
                      library.type === "book"
                        ? "Filter by title or author..."
                        : "Filter by title..."
                    }
                  />
                </div>
              )*/}
              {/*<ViewMode />*/}
              <div className="fixed top-10 left-0 px-5 h-[3rem] w-full flex flex-col md:flex-row justify-between">
                <Button
                  onPress={async () => {
                    if (loading) {
                      return;
                    }

                    if (prevLink) {
                      setLoading(true);
                      await getBooksByPage(prevLink);
                      setLoading(false);
                    }
                  }}
                  disabled={!prevLink}
                >
                  Prev Page
                </Button>
                <Button
                  className="w-full md:w-auto"
                  onPress={async () => {
                    if (loading) {
                      return;
                    }

                    if (nextLink) {
                      setLoading(true);
                      await getBooksByPage(nextLink);
                      setLoading(false);
                    }
                  }}
                  disabled={!nextLink}
                >
                  Next Page
                </Button>
              </div>
              <div
                className="mt-[7.5rem] md:mt-[4.5rem] pb-[8rem] overflow-y-auto"
                style={{
                  height: `calc(100vh - 7.5rem - 4rem)`,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-5 auto-rows-fr">
                  {((opdsBooks as any).books as any[]).map(
                    (entity: any, index: number) => (
                      <OpdsCard
                        key={`library-files-card-${entity.id}-${index}`}
                        entity={entity}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
      <TabBar />
    </div>
  );
}
