"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { marriedToFormValue } from "@/lib/account/immigrationProfileOptions";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

type AccountMeResponse = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
};

type ImmigrationProfileContextValue = {
  profileEmail: string | null;
  defaultCategory: string;
  setDefaultCategory: (value: string) => void;
  defaultCountry: string;
  setDefaultCountry: (value: string) => void;
  defaultBulletinType: string;
  setDefaultBulletinType: (value: string) => void;
  priorityDate: string;
  setPriorityDate: (value: string) => void;
  greenCardIssueDate: string;
  setGreenCardIssueDate: (value: string) => void;
  marriedToUsCitizen: string;
  setMarriedToUsCitizen: (value: string) => void;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>, successMessage?: string) => Promise<void>;
};

const ImmigrationProfileContext = createContext<ImmigrationProfileContextValue | null>(null);

function applyImmigrationProfile(
  immigrationProfile: ImmigrationProfile,
  setters: {
    setDefaultCategory: (value: string) => void;
    setDefaultCountry: (value: string) => void;
    setDefaultBulletinType: (value: string) => void;
    setPriorityDate: (value: string) => void;
    setGreenCardIssueDate: (value: string) => void;
    setMarriedToUsCitizen: (value: string) => void;
  },
) {
  setters.setDefaultCategory(immigrationProfile.default_category ?? "");
  setters.setDefaultCountry(immigrationProfile.default_country ?? "");
  setters.setDefaultBulletinType(immigrationProfile.default_bulletin_type ?? "");
  setters.setPriorityDate(immigrationProfile.priority_date ?? "");
  setters.setGreenCardIssueDate(immigrationProfile.green_card_issue_date ?? "");
  setters.setMarriedToUsCitizen(marriedToFormValue(immigrationProfile.married_to_us_citizen));
}

export function ImmigrationProfileProvider({ children }: { children: ReactNode }) {
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultCountry, setDefaultCountry] = useState("");
  const [defaultBulletinType, setDefaultBulletinType] = useState("");
  const [priorityDate, setPriorityDate] = useState("");
  const [greenCardIssueDate, setGreenCardIssueDate] = useState("");
  const [marriedToUsCitizen, setMarriedToUsCitizen] = useState("false");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/account/me");

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Failed to load account settings.");
        }

        const data = (await response.json()) as AccountMeResponse;

        if (cancelled) {
          return;
        }

        setProfileEmail(data.profile.email);

        if (data.immigrationProfile) {
          applyImmigrationProfile(data.immigrationProfile, {
            setDefaultCategory,
            setDefaultCountry,
            setDefaultBulletinType,
            setPriorityDate,
            setGreenCardIssueDate,
            setMarriedToUsCitizen,
          });
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load account settings.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>, successMessage = "Immigration profile saved.") => {
      event.preventDefault();
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch("/api/account/immigration-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            defaultCategory,
            defaultCountry,
            defaultBulletinType,
            priorityDate,
            greenCardIssueDate,
            marriedToUsCitizen: marriedToUsCitizen === "true",
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          immigrationProfile?: ImmigrationProfile;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to save immigration profile.");
        }

        if (payload.immigrationProfile) {
          applyImmigrationProfile(payload.immigrationProfile, {
            setDefaultCategory,
            setDefaultCountry,
            setDefaultBulletinType,
            setPriorityDate,
            setGreenCardIssueDate,
            setMarriedToUsCitizen,
          });
        }

        setSuccess(successMessage);
      } catch (saveError: unknown) {
        const message =
          saveError instanceof Error ? saveError.message : "Failed to save immigration profile.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [
      defaultCategory,
      defaultCountry,
      defaultBulletinType,
      priorityDate,
      greenCardIssueDate,
      marriedToUsCitizen,
    ],
  );

  const value = useMemo<ImmigrationProfileContextValue>(
    () => ({
      profileEmail,
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
      isSaving,
      error,
      success,
      handleSubmit,
    }),
    [
      profileEmail,
      defaultCategory,
      defaultCountry,
      defaultBulletinType,
      priorityDate,
      greenCardIssueDate,
      marriedToUsCitizen,
      isLoading,
      isSaving,
      error,
      success,
      handleSubmit,
    ],
  );

  return (
    <ImmigrationProfileContext.Provider value={value}>{children}</ImmigrationProfileContext.Provider>
  );
}

export function useImmigrationProfileForm() {
  const context = useContext(ImmigrationProfileContext);

  if (!context) {
    throw new Error("useImmigrationProfileForm must be used within ImmigrationProfileProvider.");
  }

  return context;
}
