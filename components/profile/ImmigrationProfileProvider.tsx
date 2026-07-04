"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  PROFILE_SECTION_IDS,
  useProfileDirtyState,
} from "@/components/profile/ProfileDirtyStateProvider";
import { marriedToFormValue } from "@/lib/account/immigrationProfileOptions";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

type AccountMeResponse = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
};

type ImmigrationProfilePayload = {
  defaultCategory: string;
  defaultCountry: string;
  defaultBulletinType: string;
  priorityDate: string;
  greenCardIssueDate: string;
  marriedToUsCitizen: boolean;
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
  clearImmigrationSection: () => Promise<void>;
  clearGreenCardSection: () => Promise<void>;
};

const ImmigrationProfileContext = createContext<ImmigrationProfileContextValue | null>(null);

const SECTION_CLEARED_MESSAGE = "Section cleared. Click Save to apply changes.";

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
  const { markDirty, markClean, registerSaveHandler } = useProfileDirtyState();
  const hasLoadedRef = useRef(false);

  const [defaultCategory, setDefaultCategoryState] = useState("");
  const [defaultCountry, setDefaultCountryState] = useState("");
  const [defaultBulletinType, setDefaultBulletinTypeState] = useState("");
  const [priorityDate, setPriorityDateState] = useState("");
  const [greenCardIssueDate, setGreenCardIssueDateState] = useState("");
  const [marriedToUsCitizen, setMarriedToUsCitizenState] = useState("false");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);

  const trackChange = useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        setter(value);
        if (hasLoadedRef.current) {
          markDirty(PROFILE_SECTION_IDS.immigration);
          setSuccess(null);
        }
      },
    [markDirty],
  );

  const setDefaultCategory = useMemo(
    () => trackChange(setDefaultCategoryState),
    [trackChange],
  );
  const setDefaultCountry = useMemo(() => trackChange(setDefaultCountryState), [trackChange]);
  const setDefaultBulletinType = useMemo(
    () => trackChange(setDefaultBulletinTypeState),
    [trackChange],
  );
  const setPriorityDate = useMemo(() => trackChange(setPriorityDateState), [trackChange]);
  const setGreenCardIssueDate = useMemo(
    () => trackChange(setGreenCardIssueDateState),
    [trackChange],
  );
  const setMarriedToUsCitizen = useMemo(
    () => trackChange(setMarriedToUsCitizenState),
    [trackChange],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/account/me");
        const result = await readJsonResponseBody<AccountMeResponse>(response);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const data = result.data;

        if (cancelled) {
          return;
        }

        setProfileEmail(data.profile.email);

        if (data.immigrationProfile) {
          applyImmigrationProfile(data.immigrationProfile, {
            setDefaultCategory: setDefaultCategoryState,
            setDefaultCountry: setDefaultCountryState,
            setDefaultBulletinType: setDefaultBulletinTypeState,
            setPriorityDate: setPriorityDateState,
            setGreenCardIssueDate: setGreenCardIssueDateState,
            setMarriedToUsCitizen: setMarriedToUsCitizenState,
          });
        }

        hasLoadedRef.current = true;
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

  const saveImmigrationProfile = useCallback(
    async (payload: ImmigrationProfilePayload, successMessage: string) => {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch("/api/account/immigration-profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await readJsonResponseBody<{
          error?: string;
          immigrationProfile?: ImmigrationProfile;
        }>(response);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const responsePayload = result.data;

        if (responsePayload.immigrationProfile) {
          applyImmigrationProfile(responsePayload.immigrationProfile, {
            setDefaultCategory: setDefaultCategoryState,
            setDefaultCountry: setDefaultCountryState,
            setDefaultBulletinType: setDefaultBulletinTypeState,
            setPriorityDate: setPriorityDateState,
            setGreenCardIssueDate: setGreenCardIssueDateState,
            setMarriedToUsCitizen: setMarriedToUsCitizenState,
          });
        }

        setSuccess(successMessage);
        markClean(PROFILE_SECTION_IDS.immigration);
      } catch (saveError: unknown) {
        const message =
          saveError instanceof Error ? saveError.message : "Failed to save immigration profile.";
        setError(message);
        throw saveError instanceof Error ? saveError : new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [markClean],
  );

  const saveCurrentImmigrationProfile = useCallback(async () => {
    await saveImmigrationProfile(
      {
        defaultCategory,
        defaultCountry,
        defaultBulletinType,
        priorityDate,
        greenCardIssueDate,
        marriedToUsCitizen: marriedToUsCitizen === "true",
      },
      "Immigration profile saved.",
    );
  }, [
    defaultCategory,
    defaultCountry,
    defaultBulletinType,
    priorityDate,
    greenCardIssueDate,
    marriedToUsCitizen,
    saveImmigrationProfile,
  ]);

  useEffect(() => {
    return registerSaveHandler(PROFILE_SECTION_IDS.immigration, saveCurrentImmigrationProfile);
  }, [registerSaveHandler, saveCurrentImmigrationProfile]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>, successMessage = "Immigration profile saved.") => {
      event.preventDefault();

      try {
        await saveImmigrationProfile(
          {
            defaultCategory,
            defaultCountry,
            defaultBulletinType,
            priorityDate,
            greenCardIssueDate,
            marriedToUsCitizen: marriedToUsCitizen === "true",
          },
          successMessage,
        );
      } catch {
        // Error state is already set by saveImmigrationProfile.
      }
    },
    [
      defaultCategory,
      defaultCountry,
      defaultBulletinType,
      priorityDate,
      greenCardIssueDate,
      marriedToUsCitizen,
      saveImmigrationProfile,
    ],
  );

  const clearImmigrationSection = useCallback(async () => {
    setDefaultCategoryState("");
    setDefaultCountryState("");
    setDefaultBulletinTypeState("");
    setPriorityDateState("");
    setError(null);
    setSuccess(SECTION_CLEARED_MESSAGE);
    markDirty(PROFILE_SECTION_IDS.immigration);
  }, [markDirty]);

  const clearGreenCardSection = useCallback(async () => {
    setGreenCardIssueDateState("");
    setMarriedToUsCitizenState("false");
    setError(null);
    setSuccess(SECTION_CLEARED_MESSAGE);
    markDirty(PROFILE_SECTION_IDS.immigration);
  }, [markDirty]);

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
      clearImmigrationSection,
      clearGreenCardSection,
    }),
    [
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
      clearImmigrationSection,
      clearGreenCardSection,
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
