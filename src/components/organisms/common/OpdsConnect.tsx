import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";

import Button from "../../atoms/Button";
import { useOpds } from "../../../hooks/useOpds";
import { useOpdsStore } from "../../../store/opds";

interface OpdsConnectProps {
  value: string;
  onChange: (value: string) => void;
}

const OpdsConnectInput = memo(({ value, onChange }: OpdsConnectProps) => {
  const { t } = useTranslation();
  const { connectToOpds } = useOpds();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.input}
          placeholder={t("common.serverUrl")}
          aria-label={t("common.serverUrl")}
        />
      </div>
      <div className="w-full">
        <Button
          onPress={() => {
            connectToOpds(value);
          }}
          className="rounded-t-none md:text-lg w-full md:w-full p-4"
        >
          Connect to OPDS Server
        </Button>
      </div>
    </div>
  );
});

OpdsConnect.displayName = "OpdsConnect";

export default function OpdsConnect() {
  const { opdsUrl, setOpdsUrl } = useOpdsStore(
    useShallow((state) => ({
      opdsUrl: state.opdsUrl,
      setOpdsUrl: state.setOpdsUrl,
    }))
  );

  return <OpdsConnectInput value={opdsUrl || ""} onChange={setOpdsUrl} />;
}

const styles = {
  input:
    "border border-primary border-b-0 rounded-md rounded-b-none p-5 w-full bg-input text-white focus:outline-none focus:border-primary transition-colors",
};
