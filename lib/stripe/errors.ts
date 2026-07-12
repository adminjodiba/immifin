/**
 * Typed errors for Stripe server configuration and catalog validation.
 * Safe messages only — never attach secrets or raw Stripe payloads.
 */

export const STRIPE_ERROR_CODES = {
  STRIPE_CONFIG_ERROR: "STRIPE_CONFIG_ERROR",
  STRIPE_CATALOG_ERROR: "STRIPE_CATALOG_ERROR",
  STRIPE_CHECKOUT_ERROR: "STRIPE_CHECKOUT_ERROR",
  STRIPE_CUSTOMER_ERROR: "STRIPE_CUSTOMER_ERROR",
} as const;

export type StripeErrorCode = (typeof STRIPE_ERROR_CODES)[keyof typeof STRIPE_ERROR_CODES];

export class StripeConfigError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_CONFIG_ERROR;

  constructor(message: string) {
    super(message);
    this.name = "StripeConfigError";
  }
}

export class StripeCatalogError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_CATALOG_ERROR;

  constructor(message: string) {
    super(message);
    this.name = "StripeCatalogError";
  }
}

export class StripeCheckoutError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_CHECKOUT_ERROR;
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StripeCheckoutError";
    this.status = status;
  }
}

export function isStripeCheckoutError(error: unknown): error is StripeCheckoutError {
  return error instanceof StripeCheckoutError;
}

export function isStripeConfigError(error: unknown): error is StripeConfigError {
  return error instanceof StripeConfigError;
}

export function isStripeCatalogError(error: unknown): error is StripeCatalogError {
  return error instanceof StripeCatalogError;
}

export class StripeCustomerError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_CUSTOMER_ERROR;
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "StripeCustomerError";
    this.status = status;
  }
}

export function isStripeCustomerError(error: unknown): error is StripeCustomerError {
  return error instanceof StripeCustomerError;
}
