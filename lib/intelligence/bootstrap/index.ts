/**
 * Intelligence provider bootstrap exports (S8-IIP-007).
 *
 * Application server modules should prefer:
 *   `@/lib/intelligence/bootstrap/server`
 */

export { createBootstrappedIntelligenceProviderRegistry } from "@/lib/intelligence/bootstrap/create-bootstrapped-intelligence-provider-registry";
export type { CreateBootstrappedIntelligenceProviderRegistryOptions } from "@/lib/intelligence/bootstrap/intelligence-provider-bootstrap.types";
