"use client";



/**

 * Single-turn Intelligence Ask controller.

 *

 * - One in-flight request (sync guard + AbortController)

 * - Sequence id (stale response protection)

 * - Aborted requests do not surface generic errors

 * - No retries, polling, history, or persistence

 */



import { useCallback, useEffect, useRef, useState } from "react";

import { askIntelligence } from "@/lib/intelligence/client/ask-intelligence";

import type { IntelligenceAskClientResult } from "@/lib/intelligence/client/intelligence-ask.types";



export type IntelligenceAskUiStatus =

  | "idle"

  | "submitting"

  | "completed"

  | "needs_profile_information"

  | "error";



export type UseIntelligenceAskState = {

  status: IntelligenceAskUiStatus;

  result: IntelligenceAskClientResult | null;

  isSubmitting: boolean;

};



export type UseIntelligenceAskReturn = UseIntelligenceAskState & {

  submit: (question: string) => Promise<void>;

  reset: () => void;

  cancel: () => void;

};



export function useIntelligenceAsk(): UseIntelligenceAskReturn {

  const [status, setStatus] = useState<IntelligenceAskUiStatus>("idle");

  const [result, setResult] = useState<IntelligenceAskClientResult | null>(null);

  const sequenceRef = useRef(0);

  const abortRef = useRef<AbortController | null>(null);

  const inFlightRef = useRef(false);

  const mountedRef = useRef(true);



  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

      abortRef.current?.abort();

      abortRef.current = null;

      inFlightRef.current = false;

    };

  }, []);



  const cancel = useCallback(() => {

    abortRef.current?.abort();

    abortRef.current = null;

    inFlightRef.current = false;

    sequenceRef.current += 1;

    if (mountedRef.current) {

      setStatus("idle");

    }

  }, []);



  const reset = useCallback(() => {

    abortRef.current?.abort();

    abortRef.current = null;

    inFlightRef.current = false;

    sequenceRef.current += 1;

    if (mountedRef.current) {

      setResult(null);

      setStatus("idle");

    }

  }, []);



  const submit = useCallback(async (question: string) => {

    // Replace any in-flight request; sync guard prevents same-tick double-start races

    // from both proceeding without abort (click + Ctrl/Cmd+Enter).

    abortRef.current?.abort();

    const controller = new AbortController();

    abortRef.current = controller;

    inFlightRef.current = true;

    const sequence = sequenceRef.current + 1;

    sequenceRef.current = sequence;



    if (mountedRef.current) {

      setStatus("submitting");

      // Clear prior answer/error UI while preserving the composer question in the parent.

      setResult(null);

    }



    try {

      const next = await askIntelligence({

        question,

        signal: controller.signal,

      });



      if (!mountedRef.current || sequence !== sequenceRef.current) {

        return;

      }



      inFlightRef.current = false;

      setResult(next);

      if (next.kind === "completed") {

        setStatus("completed");

      } else if (next.kind === "needs_profile_information") {

        setStatus("needs_profile_information");

      } else {

        setStatus("error");

      }

    } catch (error: unknown) {

      if (error instanceof DOMException && error.name === "AbortError") {

        // Superseded or cancelled — do not show a misleading generic error.

        return;

      }

      if (!mountedRef.current || sequence !== sequenceRef.current) {

        return;

      }

      inFlightRef.current = false;

      setResult({

        kind: "error",

        errorKind: "generic",

        message: "Something went wrong. Please try again.",

      });

      setStatus("error");

    }

  }, []);



  return {

    status,

    result,

    isSubmitting: status === "submitting",

    submit,

    reset,

    cancel,

  };

}


