import { Fragment, useCallback } from "react";
import { useNavigate } from "react-router";

import { ProviderButton } from "../components/molecules/ProviderButton";
import ServerConnect from "../components/organisms/common/ServerConnect";
import { LoadingState } from "../components/organisms/common/LoadingState";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { CLOUD_PROVIDERS } from "../config/providers";
import { useServer } from "../hooks/useServer";
import { flags } from "../flags";

export default function HomeScreen() {
  const navigate = useNavigate();
  const { loading } = useServer();

  const handleProviderClick = useCallback(
    (route: string) => {
      navigate(route);
    },
    [navigate]
  );

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-24 pt-8">
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="flex flex-col items-center justify-center h-full w-full md:w-1/2 md:mx-auto">
              <ServerConnect />
              <div className="mt-5 gap-5 grid grid-cols-1 md:grid-cols-4 w-full">
                {CLOUD_PROVIDERS.map((provider) => (
                  <Fragment key={provider.route}>
                    {flags.providers[
                      provider.key as keyof typeof flags.providers
                    ] && (
                      <ProviderButton
                        key={provider.route}
                        provider={provider}
                        onClick={handleProviderClick}
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </>
        )}
      </Container>
      {!loading && <TabBar />}
    </div>
  );
}
