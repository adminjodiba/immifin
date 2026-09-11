"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SaveHandler = () => Promise<void>;

type ProfileDirtyStateContextValue = {
  isProfileDirty: boolean;
  markDirty: (sectionId: string) => void;
  markClean: (sectionId?: string) => void;
  registerSaveHandler: (id: string, handler: SaveHandler) => () => void;
  saveAllPending: () => Promise<void>;
};

const ProfileDirtyStateContext = createContext<ProfileDirtyStateContextValue | null>(null);

export function ProfileDirtyStateProvider({ children }: { children: ReactNode }) {
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const dirtySectionsRef = useRef(new Set<string>());
  const saveHandlersRef = useRef(new Map<string, SaveHandler>());

  const syncDirtyFlag = useCallback(() => {
    setIsProfileDirty(dirtySectionsRef.current.size > 0);
  }, []);

  const markDirty = useCallback(
    (sectionId: string) => {
      dirtySectionsRef.current.add(sectionId);
      syncDirtyFlag();
    },
    [syncDirtyFlag],
  );

  const markClean = useCallback(
    (sectionId?: string) => {
      if (sectionId) {
        dirtySectionsRef.current.delete(sectionId);
      } else {
        dirtySectionsRef.current.clear();
      }
      syncDirtyFlag();
    },
    [syncDirtyFlag],
  );

  const registerSaveHandler = useCallback((id: string, handler: SaveHandler) => {
    saveHandlersRef.current.set(id, handler);

    return () => {
      saveHandlersRef.current.delete(id);
    };
  }, []);

  const saveAllPending = useCallback(async () => {
    const handlers = [...saveHandlersRef.current.values()];
    const errors: unknown[] = [];

    for (const handler of handlers) {
      try {
        await handler();
      } catch (error: unknown) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      const first = errors[0];
      throw first instanceof Error ? first : new Error("Failed to save some profile changes.");
    }
  }, []);

  const value = useMemo(
    () => ({
      isProfileDirty,
      markDirty,
      markClean,
      registerSaveHandler,
      saveAllPending,
    }),
    [isProfileDirty, markDirty, markClean, registerSaveHandler, saveAllPending],
  );

  return (
    <ProfileDirtyStateContext.Provider value={value}>{children}</ProfileDirtyStateContext.Provider>
  );
}

export function useProfileDirtyState() {
  const context = useContext(ProfileDirtyStateContext);

  if (!context) {
    throw new Error("useProfileDirtyState must be used within ProfileDirtyStateProvider.");
  }

  return context;
}

/** Safe for components that may render outside Manage Profile (e.g. onboarding). */
export function useOptionalProfileDirtyState() {
  return useContext(ProfileDirtyStateContext);
}

export const PROFILE_SECTION_IDS = {
  immigration: "immigration-profile",
  contact: "contact-profile",
  notifications: "notifications",
} as const;
