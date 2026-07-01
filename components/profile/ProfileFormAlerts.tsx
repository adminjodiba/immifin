"use client";

import { useImmigrationProfileForm } from "@/components/profile/ImmigrationProfileProvider";

export function ProfileFormAlerts() {
  const { error, success } = useImmigrationProfileForm();

  return (
    <>
      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          {success}
        </div>
      )}
    </>
  );
}
