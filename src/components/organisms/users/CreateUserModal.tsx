import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useCallback, memo } from "react";

import Button from "../../atoms/Button";
import { useServer } from "../../../hooks/useServer";

export const CreateUserModal = memo(
  ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { createUser } = useServer();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [payload, setPayload] = useState({
      username: "",
      password: "",
      passwordConfirm: "",
      role: "user",
    });

    const handleSubmit = useCallback(async () => {
      if (payload.username && payload.username.length === 0) {
        setError(t("login.createErrorUsername"));
        return;
      }
      if (payload.password && payload.password.length <= 8) {
        setError(t("login.createErrorPasswordLength"));
        return;
      }
      if (payload.password !== payload.passwordConfirm) {
        setError(t("login.createErrorPasswordConfirm"));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        try {
          await createUser(payload.username, payload.password, payload.role);
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }, [payload, onClose, t]);

    return (
      <Dialog
        open={isOpen}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={onClose}
        style={{
          zIndex: 99999,
        }}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-black/85">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-gray-900 text-white p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
            >
              <DialogTitle as="h3" className="font-semibold text-2xl">
                {t("users.createUser")}
              </DialogTitle>
              <div className="mt-5">
                <label htmlFor="username" className="font-semibold">
                  {t("login.username")}
                </label>
                <input
                  type="text"
                  id="username"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.username}
                  onChange={(e) =>
                    setPayload({ ...payload, username: e.target.value })
                  }
                />
                <label htmlFor="password" className="font-semibold">
                  {t("login.password")}
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.password}
                  onChange={(e) =>
                    setPayload({ ...payload, password: e.target.value })
                  }
                />
                <label htmlFor="passwordConfirm" className="font-semibold">
                  {t("login.passwordConfirm")}
                </label>
                <input
                  type="password"
                  id="passwordConfirm"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.passwordConfirm}
                  onChange={(e) =>
                    setPayload({ ...payload, passwordConfirm: e.target.value })
                  }
                />
                <label htmlFor="role" className="font-semibold">
                  {t("users.role")}
                </label>
                <select
                  id="role"
                  className="w-full bg-gray-800 rounded-md p-2 text-white mb-5 mt-2 border border-gray-500"
                  value={payload.role}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      role: e.target.value as
                        | "admin"
                        | "user"
                        | "moderator"
                        | "upload",
                    })
                  }
                >
                  {["admin", "user", "moderator", "upload"].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <div
                  className="mt-5 p-2 bg-red-900/50 rounded-md text-white"
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                >
                  {error}
                </div>
              )}
              <div>
                <Button
                  className="w-full"
                  disabled={loading}
                  onPress={handleSubmit}
                >
                  {t("users.createUser")}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }
);
