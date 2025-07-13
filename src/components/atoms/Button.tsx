import React, { useMemo } from "react";

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

function Button({
  onPress,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const buttonClassName = useMemo(() => {
    const baseClass =
      "bg-tertiary border border-primary text-sm font-semibold rounded-xl p-3 text-white flex flex-row items-center justify-center gap-2";
    const customClass = className || "";
    const stateClass = disabled
      ? "opacity-50 hover:cursor-not-allowed"
      : "hover:cursor-pointer hover:bg-quaternary";

    return `${baseClass} ${customClass} ${stateClass}`;
  }, [className, disabled]);

  return (
    <button
      onClick={onPress}
      className={buttonClassName}
      disabled={disabled}
      aria-busy={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
