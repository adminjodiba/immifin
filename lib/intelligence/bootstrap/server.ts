/**
 * Server-only bootstrap entry (S8-IIP-007).
 */

import "server-only";

export { createBootstrappedIntelligenceProviderRegistry } from "@/lib/intelligence/bootstrap/create-bootstrapped-intelligence-provider-registry";
export type { CreateBootstrappedIntelligenceProviderRegistryOptions } from "@/lib/intelligence/bootstrap/intelligence-provider-bootstrap.types";
