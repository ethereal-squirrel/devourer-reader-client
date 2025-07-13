import { memo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

import Button from "../../atoms/Button";
import { useServer } from "../../../hooks/useServer";
import { useAuthStore } from "../../../store/auth";
import { useCommonStore } from "../../../store/common";

interface ServerInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ServerInput = memo(({ value, onChange }: ServerInputProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { connectToServer, loading } = useServer();
  const { displayAuthModal, setDisplayAuthModal } = useAuthStore(
    useShallow((state) => ({
      displayAuthModal: state.displayAuthModal,
      setDisplayAuthModal: state.setDisplayAuthModal,
    }))
  );

  const close = () => {
    setDisplayAuthModal(false);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="w-full">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={styles.input}
            placeholder={t("common.serverUrl")}
            aria-label={t("common.serverUrl")}
            disabled={loading}
          />
        </div>
        <div className="w-full">
          <Button
            onPress={async () => {
              if (isLoading) {
                return;
              }

              setIsLoading(true);

              const outcome = await connectToServer(
                username || undefined,
                password || undefined
              );

              if (!outcome) {
                setIsLoading(false);
              }
            }}
            className={`rounded-t-none md:text-lg w-full md:w-full p-4 ${
              isLoading ? "opacity-50 hover:cursor-not-allowed" : ""
            }`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? t("common.connecting") : t("common.connectToServer")}
          </Button>
        </div>
      </div>

      <Dialog
        open={displayAuthModal}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={() => {
          if (isLoading) {
            return;
          }

          close();
        }}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
            >
              <DialogTitle
                as="h3"
                className="text-base/7 font-medium text-white"
              >
                {t("login.title")}
              </DialogTitle>
              <p className="mt-2 text-sm/6 text-white">
                {t("login.description")}
              </p>
              <div className="mt-2 text-white/85">
                <label htmlFor="username" className="text-sm/6 font-semibold">
                  {t("login.username")}
                </label>
                <input
                  type="text"
                  value={username || ""}
                  onChange={(e) => setUsername(e.target.value)}
                  className="my-2 border border-primary rounded-md p-3 w-full bg-input text-white focus:outline-none focus:border-primary transition-colors"
                />
                <label htmlFor="password" className="text-sm/6 font-semibold">
                  {t("login.password")}
                </label>
                <input
                  type="password"
                  value={password || ""}
                  onChange={(e) => setPassword(e.target.value)}
                  className="my-2 border border-primary rounded-md p-3 w-full bg-input text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="mt-4">
                <Button
                  className={`w-full md:w-full ${
                    isLoading ? "opacity-50 hover:cursor-not-allowed" : ""
                  }`}
                  onPress={async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);

                    const outcome = await connectToServer(
                      username || undefined,
                      password || undefined
                    );

                    if (!outcome) {
                      setIsLoading(false);
                    }
                  }}
                  disabled={loading}
                  aria-busy={loading}
                >
                  {t("login.login")}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
});

ServerInput.displayName = "ServerInput";

export default function ServerConnect() {
  const { server, setServer } = useCommonStore(
    useShallow((state) => ({
      server: state.server,
      setServer: state.setServer,
    }))
  );

  return (
    <ServerInput
      value={server}
      onChange={(value) => {
        setServer(value.toLowerCase().trim());
      }}
    />
  );
}

const styles = {
  input:
    "border border-primary border-b-0 rounded-md rounded-b-none p-5 w-full bg-input text-white focus:outline-none focus:border-primary transition-colors",
};
