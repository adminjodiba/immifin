"use client";

import { useImmigrationProfileForm } from "@/components/profile/ImmigrationProfileProvider";
import { MyProfileQuadrant } from "@/components/profile/MyProfileQuadrant";
import { marriedToUsCitizenOptions } from "@/lib/account/immigrationProfileOptions";

export function GreenCardProfileSection() {
  const {
    greenCardIssueDate,
    setGreenCardIssueDate,
    marriedToUsCitizen,
    setMarriedToUsCitizen,
    isLoading,
  } = useImmigrationProfileForm();

  return (
    <MyProfileQuadrant
      accent="greencard"
      id="profile-green-card"
      title="Greencard Journey Information"
      subtitle="Add your Green Card details to track eligibility and key dates."
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="M3.5 10h17" />
          <path d="M7 15h5" strokeLinecap="round" />
        </svg>
      }
    >
      {isLoading ? (
        <p className="ds2-profile-quad-loading">Loading green card details...</p>
      ) : (
        <div className="ds2-profile-greencard-fields">
          <div>
            <label htmlFor="green-card-issueDate" className="ds2-profile-label">
              Green card issue date
            </label>
            <input
              id="green-card-issueDate"
              name="greenCardIssueDate"
              type="date"
              className="input-field"
              value={greenCardIssueDate}
              onChange={(event) => setGreenCardIssueDate(event.target.value)}
            />
            <p className="ds2-profile-help">Leave blank if you do not have a green card yet.</p>
          </div>
          <div>
            <label htmlFor="green-card-marriedToUsCitizen" className="ds2-profile-label">
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
        </div>
      )}
    </MyProfileQuadrant>
  );
}
