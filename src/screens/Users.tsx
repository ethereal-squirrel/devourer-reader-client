import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import Button from "../components/atoms/Button";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { useServer } from "../hooks/useServer";
import { useAuthStore } from "../store/auth";
import { useCommonStore } from "../store/common";
import { CreateUserModal } from "../components/organisms/users/CreateUserModal";
import { EditUserModal } from "../components/organisms/users/EditUserModal";

export default function Users() {
  const { getUsers, deleteUser } = useServer();
  const { users } = useCommonStore(
    useShallow((state) => ({
      users: state.users,
    }))
  );
  const { username } = useAuthStore(
    useShallow((state) => ({
      username: state.username,
    }))
  );

  const { t } = useTranslation();
  const navigate = useNavigate();

  const [displayCreateModal, setDisplayCreateModal] = useState(false);
  const [displayEditModal, setDisplayEditModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <>
      <div className="h-screen flex flex-col bg-secondary">
        <Container className="flex-1 px-5 pb-24 pt-12">
          <div className="flex flex-col md:flex-row gap-2 mb-5 mt-[1.5rem] md:mt-0">
            <Button
              aria-label={t("common.returnToLibraries")}
              onPress={() => {
                navigate("/libraries");
              }}
            >
              <ArrowLeftIcon className="w-4 h-4" />{" "}
              {t("common.returnToLibraries")}
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center mb-[4rem]">
            <div className="w-full">
              <div className="bg-primary text-white p-3 text-sm rounded-lg">
                <span className="font-bold">{t("users.loggedInAs")}</span>{" "}
                <span>{username}</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mt-3">
                <h1 className="text-2xl text-white font-bold">
                  {t("users.title")}
                </h1>
                <Button
                  className="text-xs"
                  onPress={() => {
                    setDisplayCreateModal(true);
                  }}
                >
                  {t("users.createUser")}
                </Button>
              </div>
              <div className="mt-3 bg-primary text-white p-0 text-sm rounded-lg overflow-x-auto overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-3">{t("users.username")}</th>
                      <th className="text-left p-3">{t("users.role")}</th>
                      <th className="text-left p-3">
                        {t("users.collections")}
                      </th>
                      <th className="text-right p-3">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`${
                          index % 2 === 0 ? "bg-tertiary" : "bg-primary"
                        }`}
                      >
                        <td className="text-left p-3">{user.email}</td>
                        <td className="text-left p-3">{user.roles[0]}</td>
                        <td className="text-left p-3">{user.collections}</td>
                        <td className="justify-end text-right flex flex-row gap-2 py-3">
                          {user.email !== "admin" && (
                            <>
                              <Button
                                className="text-xs"
                                onPress={() => {
                                  deleteUser(user.id);
                                }}
                              >
                                {t("users.delete")}
                              </Button>
                              <Button
                                className="text-xs mr-3"
                                onPress={() => {
                                  setDisplayEditModal(true);
                                  setEditUser(user);
                                }}
                              >
                                {t("users.edit")}
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Container>
        <TabBar />
      </div>
      {displayCreateModal && (
        <CreateUserModal
          isOpen={displayCreateModal}
          onClose={() => {
            setDisplayCreateModal(false);
          }}
        />
      )}
      {displayEditModal && editUser && (
        <EditUserModal
          isOpen={displayEditModal}
          user={editUser}
          onClose={() => {
            setEditUser(null);
            setDisplayEditModal(false);
          }}
        />
      )}
    </>
  );
}
