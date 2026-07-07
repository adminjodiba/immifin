"use client";

import { useImmigrationProfileForm } from "@/components/profile/ImmigrationProfileProvider";
import { ProfileFormAlerts } from "@/components/profile/ProfileFormAlerts";
import { ProfileFormSaveButton } from "@/components/profile/ProfileFormSaveButton";
import { ProfileSectionResetButton } from "@/components/profile/ProfileSectionResetButton";
import {
  bulletinTypeOptions,
  categoryOptions,
  countryOptions,
} from "@/lib/account/immigrationProfileOptions";

export function ImmigrationProfileSection() {
  const {
    defaultCategory,
    setDefaultCategory,
    defaultCountry,
    setDefaultCountry,
    defaultBulletinType,
    setDefaultBulletinType,
    priorityDate,
    setPriorityDate,
    isLoading,
    isSaving,
    handleSubmit,
    clearImmigrationSection,
  } = useImmigrationProfileForm();

  return (
    <form
      className="space-y-5 p-1"
      onSubmit={(event) => void handleSubmit(event, "Immigration details saved.")}
    >
      <div>
        <h2 className="heading-2 text-lg">Immigration</h2>
        <p className="mt-2 text-sm text-slate-600">
          Employment-based category, country of chargeability, bulletin date type, and priority date
          for calculators and bulletin tools.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading immigration details...</p>
      ) : (
        <>
          <div>
            <label
              htmlFor="immigration-defaultCategory"
              className="block text-sm font-semibold text-slate-900"
            >
              Default category
            </label>
            <select
              id="immigration-defaultCategory"
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
            <label
              htmlFor="immigration-defaultCountry"
              className="block text-sm font-semibold text-slate-900"
            >
              Default country
            </label>
            <select
              id="immigration-defaultCountry"
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
              htmlFor="immigration-defaultBulletinType"
              className="block text-sm font-semibold text-slate-900"
            >
              Default bulletin type
            </label>
            <select
              id="immigration-defaultBulletinType"
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
            <label
              htmlFor="immigration-priorityDate"
              className="block text-sm font-semibold text-slate-900"
            >
              Priority date <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="immigration-priorityDate"
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
        </>
      )}

      <ProfileFormAlerts />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="sm:flex-1">
          <ProfileFormSaveButton label="Save immigration details" />
        </div>
        <div className="sm:flex-1">
          <ProfileSectionResetButton
            label="Clear Section"
            onReset={clearImmigrationSection}
            disabled={isLoading || isSaving}
          />
        </div>
      </div>
    </form>
  );
}
