import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useCommonStore } from "../../../store/common";

const TABS = [
  {
    id: "/",
    label: "tabBar.home",
    icon: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418",
  },
  {
    id: "/libraries",
    label: "tabBar.libraries",
    icon: "M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25",
  },
  {
    id: "/settings/client",
    label: "tabBar.settings",
    icon: "M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495",
  },
] as const;

const Tab = React.memo(
  ({
    tab,
    label,
    isActive,
    onPress,
  }: {
    tab: (typeof TABS)[number];
    label: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <>
      <button
        className={`w-full items-center py-1 transition-all duration-300 ease-in-out shadow-none rounded-full flex flex-col items-center justify-center ${
          isActive
            ? "bg-quaternary inset-shadow-sm ring-2 ring-primary shadow-lg shadow-blue-200/10"
            : "bg-secondary shadow-none hover:font-bold"
        }`}
        onClick={onPress}
        role="tab"
        aria-selected={isActive}
      >
        <svg
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke={isActive ? "white" : "#aaaaaa"}
          height={24}
          width={24}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
        </svg>
        <span className={`text-xs md:text-sm ${isActive ? "text-white" : "text-white/80"}`}>
          {label}
        </span>
      </button>
    </>
  ),
  (prev, next) => prev.isActive === next.isActive && prev.label === next.label
);

export const TabBar = React.memo(() => {
  const activeTab = useCommonStore((state) => state.activeTab);
  const setActiveTab = useCommonStore((state) => state.setActiveTab);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleTabPress = useCallback(
    (tab: (typeof TABS)[number]) => {
      setActiveTab(tab.id);
      navigate(`${tab.id}`);
    },
    [setActiveTab, navigate]
  );

  useEffect(() => {
    const path = window.location.pathname;

    if (path.includes("/libraries")) {
      setActiveTab("/libraries");
    } else if (path.includes("/library")) {
      setActiveTab("/libraries");
    } else if (path.includes("/book")) {
      setActiveTab("/libraries");
    } else if (path.includes("/manga")) {
      setActiveTab("/libraries");
    } else if (path.includes("/settings/client")) {
      setActiveTab("/settings/client");
    } else {
      setActiveTab("/");
    }
  }, [activeTab]);

  return (
    <div 
      className="fixed bottom-0 left-0 mb-5 w-screen px-10 md:left-[25%] md:w-1/2"
      style={
        import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile" 
          ? {
              position: "fixed" as const,
              transform: "translate3d(0, 0, 0)",
              WebkitTransform: "translate3d(0, 0, 0)",
              bottom: "env(safe-area-inset-bottom, 20px)",
              zIndex: 9999,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden"
            }
          : {
              position: "fixed" as const
            }
      }
    >
      <div
        className="w-full grid grid-cols-3 gap-5 rounded-full bg-primary/80 p-3 inset-shadow-sm shadow-xl shadow-blue-200/10 backdrop-blur-xl ring-2 ring-white"
        role="tablist"
        style={{
          transform: import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile" 
            ? "translate3d(0, 0, 0)" 
            : undefined,
          WebkitTransform: import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile" 
            ? "translate3d(0, 0, 0)" 
            : undefined
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            label={t(tab.label)}
            isActive={activeTab === tab.id}
            onPress={() => handleTabPress(tab)}
          />
        ))}
      </div>
    </div>
  );
});
