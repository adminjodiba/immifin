"use client";

import { useCallback, useEffect, useState } from "react";
import {
  myProfileHashFor,
  parseMyProfileHash,
  type MyProfileSectionId,
} from "@/lib/profile/myProfileSection";

export function useMyProfileSection() {
  const [section, setSection] = useState<MyProfileSectionId>("contact");

  useEffect(() => {
    const sync = () => {
      setSection(parseMyProfileHash(window.location.hash));
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const selectSection = useCallback((next: MyProfileSectionId) => {
    const nextHash = myProfileHashFor(next);
    if (window.location.hash === nextHash) {
      setSection(next);
      return;
    }
    window.location.hash = nextHash;
  }, []);

  return { section, selectSection };
}
