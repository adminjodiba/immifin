"use client";

import { useImmigrationProfileForm } from "@/components/profile/ImmigrationProfileProvider";
import { ProfileFormAlerts } from "@/components/profile/ProfileFormAlerts";
import { ProfileFormSaveButton } from "@/components/profile/ProfileFormSaveButton";
import {
  bulletinTypeOptions,
  categoryOptions,
  countryOptions,
  marriedToUsCitizenOptions,
} from "@/lib/account/immigrationProfileOptions";

export function AccountImmigrationProfileForm() {
  const {
    defaultCategory,
    setDefaultCategory,
    defaultCountry,
    setDefaultCountry,
    defaultBulletinType,
    setDefaultBulletinType,
    priorityDate,
    setPriorityDate,
    greenCardIssueDate,
    setGreenCardIssueDate,
    marriedToUsCitizen,
    setMarriedToUsCitizen,
    isLoading,
    handleSubmit,
  } = useImmigrationProfileForm();

  return (
    <form
      className="card-static space-y-5"
      onSubmit={(event) => void handleSubmit(event, "Immigration profile saved.")}
    >
      <div>
        <h2 className="heading-2">Immigration Profile</h2>
        <p className="mt-2 text-sm text-slate-600">
          Set employment-based defaults, priority date, country of chargeability, bulletin date
          type, and optional citizenship planning fields.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading account settings...</p>
      ) : (
        <>
          <div>
            <label htmlFor="defaultCategory" className="block text-sm font-semibold text-slate-900">
              Default category
            </label>
            <select
              id="defaultCategory"
              name="defaultCategory"
              className="input-field"
              value={defaultCategory}
              onChange={(event) => setDefaultCategory(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="defaultCountry" className="block text-sm font-semibold text-slate-900">
              Default country
            </label>
            <select
              id="defaultCountry"
              name="defaultCountry"
              className="input-field"
              value={defaultCountry}
              onChange={(event) => setDefaultCountry(event.target.value)}
            >
              {countryOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="defaultBulletinType"
              className="block text-sm font-semibold text-slate-900"
            >
              Default bulletin type
            </label>
            <select
              id="defaultBulletinType"
              name="defaultBulletinType"
              className="input-field"
              value={defaultBulletinType}
              onChange={(event) => setDefaultBulletinType(event.target.value)}
            >
              {bulletinTypeOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priorityDate" className="block text-sm font-semibold text-slate-900">
              Priority date <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="priorityDate"
              name="priorityDate"
              type="date"
              className="input-field"
              value={priorityDate}
              onChange={(event) => setPriorityDate(event.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Used to prefill the Green Card Calculator.
            </p>
          </div>

          <div>
            <label
              htmlFor="greenCardIssueDate"
              className="block text-sm font-semibold text-slate-900"
            >
              Green card issue date <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="greenCardIssueDate"
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
              htmlFor="marriedToUsCitizen"
              className="block text-sm font-semibold text-slate-900"
            >
              Married to U.S. citizen
            </label>
            <select
              id="marriedToUsCitizen"
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
      <ProfileFormSaveButton />
    </form>
  );
}
