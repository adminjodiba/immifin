/**
 * Client-safe Intelligence Workspace helpers (S8-IIP-009).
 * Do not import server-only service/provider modules from here.
 */

export {
  INTELLIGENCE_ASK_CLIENT_PROVIDER_ID,
  INTELLIGENCE_ASK_ENDPOINT,
  type IntelligenceAskClientError,
  type IntelligenceAskClientErrorKind,
  type IntelligenceAskClientResult,
  type IntelligenceAskCompletedClientResult,
  type IntelligenceAskNeedsProfileClientResult,
} from "@/lib/intelligence/client/intelligence-ask.types";
export { askIntelligence, type AskIntelligenceInput } from "@/lib/intelligence/client/ask-intelligence";
export {
  mapIntelligenceAskHttpError,
  mapIntelligenceAskNetworkError,
} from "@/lib/intelligence/client/map-intelligence-ask-error";
export { formatIntelligenceBlockingReason } from "@/lib/intelligence/client/intelligence-profile-labels";
export { INTELLIGENCE_SUGGESTED_QUESTIONS } from "@/lib/intelligence/client/intelligence-suggested-questions";
export {
  useIntelligenceAsk,
  type IntelligenceAskUiStatus,
  type UseIntelligenceAskReturn,
} from "@/lib/intelligence/client/use-intelligence-ask";
