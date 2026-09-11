/**
 * IMMIFIN Intelligence Prompt Payload — Version 1 contract types.
 *
 * Provider-neutral structured payload for a future LLM adapter.
 * No vendor message shapes, no model calls, no persistence.
 */

import type {
  IntelligenceContextGreenCard,
  IntelligenceContextImmigration,
  IntelligenceContextJourney,
  IntelligenceContextReadiness,
  IntelligenceContextSubscription,
  IntelligenceContextVisaBulletin,
} from "@/lib/intelligence/context/intelligence-context.types";
import type { IntelligenceRequestReadiness } from "@/lib/intelligence/request/intelligence-request.types";

export type IntelligencePromptInstructions = {
  role: string;
  principles: string[];
  prohibitedBehaviors: string[];
};

/**
 * Context slice carried into the payload.
 * Sourced only from the Intelligence Request Envelope — no remapping of facts.
 */
export type IntelligencePromptUserContext = {
  contextVersion: string;
  journey: IntelligenceContextJourney;
  immigration: IntelligenceContextImmigration;
  greenCard: IntelligenceContextGreenCard;
  visaBulletin: IntelligenceContextVisaBulletin;
  subscription: IntelligenceContextSubscription;
  readiness: IntelligenceContextReadiness;
};

export type IntelligencePromptPayloadMetadata = {
  requestVersion: string;
  contextVersion: string;
  contextGeneratedAt: string;
  requestCreatedAt: string;
};

/**
 * Version 1 provider-neutral prompt payload.
 */
export type IntelligencePromptPayload = {
  payloadVersion: string;
  /** Copied from the Intelligence Request Envelope (diagnostic only). */
  requestId: string;
  /** UTC ISO-8601 timestamp for payload creation. */
  createdAt: string;
  instructions: IntelligencePromptInstructions;
  userContext: IntelligencePromptUserContext;
  /** Validated question preserved exactly from the request envelope. */
  userQuestion: string;
  /** Derived from Intelligence Request readiness (not a new authority). */
  readiness: IntelligenceRequestReadiness;
  metadata: IntelligencePromptPayloadMetadata;
};
