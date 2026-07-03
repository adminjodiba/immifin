"use client";

import { useState } from "react";

type ProfileSectionResetButtonProps = {
  label?: string;
  confirmMessage: string;
  onReset: () => Promise<void>;
  disabled?: boolean;
};

export function ProfileSectionResetButton({
  label = "Clear Section",
  confirmMessage,
  onReset,
  disabled = false,
}: ProfileSectionResetButtonProps) {
  const [isResetting, setIsResetting] = useState(false);

  async function handleClick() {
    if (disabled || isResetting) {
      return;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsResetting(true);

    try {
      await onReset();
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <button
      type="button"
      className="btn-secondary w-full"
      onClick={() => void handleClick()}
      disabled={disabled || isResetting}
    >
      {isResetting ? "Clearing..." : label}
    </button>
  );
}
