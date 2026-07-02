"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const LOGIN_REQUIRED_MESSAGE =
  "Please sign in or create a free IMMIFIN account to use calculators, track your immigration progress, save your profile, receive alerts, and access personalized features.";

const REDIRECT_DELAY_MS = 600;

type LoginRequiredContextValue = {
  showLoginRequired: (onRedirect: () => void) => void;
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
  const [visible, setVisible] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRedirectRef = useRef<(() => void) | null>(null);

  const clearRedirectTimer = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, []);

  const showLoginRequired = useCallback(
    (onRedirect: () => void) => {
      clearRedirectTimer();
      onRedirectRef.current = onRedirect;
      setVisible(true);

      redirectTimerRef.current = setTimeout(() => {
        onRedirectRef.current?.();
        onRedirectRef.current = null;
        setVisible(false);
      }, REDIRECT_DELAY_MS);
    },
    [clearRedirectTimer],
  );

  useEffect(() => {
    return () => {
      clearRedirectTimer();
    };
  }, [clearRedirectTimer]);

  return (
    <LoginRequiredContext.Provider value={{ showLoginRequired }}>
      {children}

      {visible && (
        <div
          className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex justify-center px-4 sm:top-24"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-brand-200 bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/80">
            <div className="flex gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg"
                aria-hidden="true"
              >
                🔒
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">Login Required</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {LOGIN_REQUIRED_MESSAGE}
                </p>
                <p className="mt-3 text-xs font-medium text-brand-700">
                  Redirecting to sign in…
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </LoginRequiredContext.Provider>
  );
}
