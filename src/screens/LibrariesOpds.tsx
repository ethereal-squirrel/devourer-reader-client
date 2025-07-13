import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";

import Button from "../components/atoms/Button";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { useOpds } from "../hooks/useOpds";
import { useOpdsStore } from "../store/opds";

export default function LibraryOpds() {
  const { t } = useTranslation();
  const { opdsLibraries } = useOpdsStore(
    useShallow((state) => ({
      opdsLibraries: state.opdsLibraries,
    }))
  );
  const { getOpdsLibrary } = useOpds();

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className={`${!opdsLibraries ? "flex-1" : ""} px-5 pt-8`}>
        <div className="flex flex-col items-center justify-center h-full w-full">
          {!opdsLibraries ? (
            <div>{t("common.loading")}</div>
          ) : (
            <div className="w-full">
              <div className="mt-5 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 auto-rows-fr">
                  {(opdsLibraries as any[]).map(
                    (entity: any, index: number) => (
                      <Button
                        key={`opds-library-${entity.id}-${index}`}
                        className="md:w-full py-10"
                        onPress={() => {
                          getOpdsLibrary(entity.id);
                        }}
                      >
                        {entity.title}
                      </Button>
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
