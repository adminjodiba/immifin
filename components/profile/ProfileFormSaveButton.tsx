"use client";

import { useImmigrationProfileForm } from "@/components/profile/ImmigrationProfileProvider";

type ProfileFormSaveButtonProps = {
  label?: string;
};

export function ProfileFormSaveButton({
  label = "Save immigration profile",
}: ProfileFormSaveButtonProps) {
  const { isLoading, isSaving } = useImmigrationProfileForm();

  return (
    <button type="submit" className="btn-primary w-full" disabled={isLoading || isSaving}>
      {isSaving ? "Saving..." : label}
    </button>
  );
}
