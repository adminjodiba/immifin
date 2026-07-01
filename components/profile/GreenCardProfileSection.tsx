"use client";

import { useImmigrationProfileForm } from "@/components/profile/ImmigrationProfileProvider";
import { ProfileFormAlerts } from "@/components/profile/ProfileFormAlerts";
import { ProfileFormSaveButton } from "@/components/profile/ProfileFormSaveButton";
import { marriedToUsCitizenOptions } from "@/lib/account/immigrationProfileOptions";

export function GreenCardProfileSection() {
  const {
    greenCardIssueDate,
    setGreenCardIssueDate,
    marriedToUsCitizen,
    setMarriedToUsCitizen,
    isLoading,
    handleSubmit,
  } = useImmigrationProfileForm();

  return (
    <form
      className="space-y-5 p-1"
      onSubmit={(event) => void handleSubmit(event, "Green card details saved.")}
    >
      <div>
        <h2 className="heading-2 text-lg">Green Card</h2>
        <p className="mt-2 text-sm text-slate-600">
          Record your green card issue date and marriage status for citizenship planning and
          calculator defaults.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading green card details...</p>
      ) : (
        <>
          <div>
            <label
              htmlFor="green-card-issueDate"
              className="block text-sm font-semibold text-slate-900"
            >
              Green card issue date <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="green-card-issueDate"
              name="greenCardIssueDate"
              type="date"
              className="input-field"
              value={greenCardIssueDate}
              onChange={(event) => setGreenCardIssueDate(event.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Leave blank if you do not have a green card yet.
            </p>
          </div>

          <div>
            <label
              htmlFor="green-card-marriedToUsCitizen"
              className="block text-sm font-semibold text-slate-900"
            >
              Married to U.S. citizen
            </label>
            <select
              id="green-card-marriedToUsCitizen"
              name="marriedToUsCitizen"
              className="input-field"
              value={marriedToUsCitizen}
              onChange={(event) => setMarriedToUsCitizen(event.target.value)}
              required
            >
              {marriedToUsCitizenOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <ProfileFormAlerts />
      <ProfileFormSaveButton label="Save green card details" />
    </form>
  );
}
