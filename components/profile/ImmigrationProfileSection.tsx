"use client";

import { useImmigrationProfileForm } from "@/components/profile/ImmigrationProfileProvider";
import { MyProfileQuadrant } from "@/components/profile/MyProfileQuadrant";
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
    error,
  } = useImmigrationProfileForm();

  return (
    <MyProfileQuadrant
      accent="immigration"
      id="profile-immigration"
      title="Immigration Information"
      subtitle="Tell us about your employment-based category, chargeability, and priority date so IMMIFIN can personalize your tools."
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.8h7.4L19 8.4v12.1H7V3.8Z" />
          <path strokeLinecap="round" d="M14.4 3.8V8.4H19M9.5 12h5M9.5 15.4h5" />
        </svg>
      }
    >
      {isLoading ? (
        <p className="ds2-profile-quad-loading">Loading immigration details...</p>
      ) : (
        <div className="ds2-profile-field-grid">
          <div>
            <label htmlFor="immigration-defaultCategory" className="ds2-profile-label">
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
            <label htmlFor="immigration-defaultCountry" className="ds2-profile-label">
              Country of chargeability
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
            <label htmlFor="immigration-defaultBulletinType" className="ds2-profile-label">
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
            <label htmlFor="immigration-priorityDate" className="ds2-profile-label">
              Priority date
            </label>
            <input
              id="immigration-priorityDate"
              name="priorityDate"
              type="date"
              className="input-field"
              value={priorityDate}
              onChange={(event) => setPriorityDate(event.target.value)}
            />
            <p className="ds2-profile-help">Used to prefill the Green Card Calculator.</p>
          </div>
        </div>
      )}
      {error ? (
        <div className="ds2-profile-quad-alert ds2-profile-quad-alert-error" role="alert">
          {error}
        </div>
      ) : null}
    </MyProfileQuadrant>
  );
}
