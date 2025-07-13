import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useImport } from "../../../hooks/useImport";
import { useImportStore } from "../../../store/import";

export default function ImportHandler() {
  const { processQueue } = useImport();

  const { currentQueue, processing } = useImportStore(
    useShallow((state) => ({
      currentQueue: state.currentQueue,
      processing: state.processing,
    }))
  );

  useEffect(() => {
    if (currentQueue.length > 0 && !processing) {
      processQueue();
    }
  }, [currentQueue, processing]);

  return null;
}
