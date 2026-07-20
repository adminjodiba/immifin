"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { sanitizeReturnPath } from "@/lib/auth/signInRedirect";
import { clerkSignInProps } from "@/lib/clerk/signIn";

const LOGIN_REQUIRED_MESSAGE =
  "Please sign in or create a free IMMIFIN account to use calculators, track your immigration progress, save your profile, receive alerts, and access personalized features.";

type LoginRequiredContextValue = {
  showLoginRequired: (returnPath?: string) => void;
  closeLoginRequired: () => void;
};

const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(null);

export function useLoginRequired(): LoginRequiredContextValue {
  const context = useContext(LoginRequiredContext);
  if (!context) {
    throw new Error("useLoginRequired must be used within LoginRequiredProvider");
  }
  return context;
}

type LoginRequiredProviderProps = {
  children: ReactNode;
};

export function LoginRequiredProvider({ children }: LoginRequiredProviderProps) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [returnPath, setReturnPath] = useState("/");

  const closeLoginRequired = useCallback(() => {
    setOpen(false);
  }, []);

  const showLoginRequired = useCallback(
    (path = "/") => {
      const safePath = sanitizeReturnPath(path);
      setReturnPath(safePath);
      setOpen(true);

      if (pathname !== "/") {
        router.push("/");
      }
    },
    [pathname, router],
  );

  useEffect(() => {
    if (isSignedIn && open) {
      setOpen(false);
    }
  }, [isSignedIn, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <LoginRequiredContext.Provider value={{ showLoginRequired, closeLoginRequired }}>
      {children}

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-10 sm:items-center sm:py-12">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label="Close login dialog"
            onClick={closeLoginRequired}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[1] w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/80 sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p id={titleId} className="text-base font-semibold text-slate-900">
                  Login Required
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {LOGIN_REQUIRED_MESSAGE}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
                onClick={closeLoginRequired}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center">
              <SignIn
                {...clerkSignInProps}
                routing="hash"
                forceRedirectUrl={returnPath}
                fallbackRedirectUrl={returnPath}
              />
            </div>
          </div>
        </div>
      ) : null}
    </LoginRequiredContext.Provider>
  );
}
