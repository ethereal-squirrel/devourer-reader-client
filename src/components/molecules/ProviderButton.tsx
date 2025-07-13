import { memo } from "react";

import Button from "../atoms/Button";
import { Provider } from "../../config/providers";

interface ProviderButtonProps {
  provider: Provider;
  onClick: (route: string) => void;
}

export const ProviderButton = memo(
  ({ provider, onClick }: ProviderButtonProps) => {
    return (
      <div>
        <Button onPress={() => onClick(provider.route)} className="w-full md:w-full p-5">
          {provider.name}
        </Button>
      </div>
    );
  }
);
