/**
 * Typed errors for Stripe server configuration and catalog validation.
 * Safe messages only — never attach secrets or raw Stripe payloads.
 */

export const STRIPE_ERROR_CODES = {
  STRIPE_CONFIG_ERROR: "STRIPE_CONFIG_ERROR",
  STRIPE_CATALOG_ERROR: "STRIPE_CATALOG_ERROR",
  STRIPE_CHECKOUT_ERROR: "STRIPE_CHECKOUT_ERROR",
  STRIPE_SUBSCRIPTION_CHANGE_ERROR: "STRIPE_SUBSCRIPTION_CHANGE_ERROR",
  STRIPE_CUSTOMER_ERROR: "STRIPE_CUSTOMER_ERROR",
  STRIPE_WEBHOOK_SIGNATURE_ERROR: "STRIPE_WEBHOOK_SIGNATURE_ERROR",
  STRIPE_WEBHOOK_CONFIG_ERROR: "STRIPE_WEBHOOK_CONFIG_ERROR",
  STRIPE_WEBHOOK_PROCESSING_ERROR: "STRIPE_WEBHOOK_PROCESSING_ERROR",
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

export class StripeSubscriptionChangeError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_SUBSCRIPTION_CHANGE_ERROR;
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StripeSubscriptionChangeError";
    this.status = status;
  }
}

export function isStripeSubscriptionChangeError(
  error: unknown,
): error is StripeSubscriptionChangeError {
  return error instanceof StripeSubscriptionChangeError;
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

export class StripeWebhookSignatureError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_WEBHOOK_SIGNATURE_ERROR;
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "StripeWebhookSignatureError";
  }
}

export class StripeWebhookConfigError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_WEBHOOK_CONFIG_ERROR;
  readonly status = 503;

  constructor(message: string) {
    super(message);
    this.name = "StripeWebhookConfigError";
  }
}

export class StripeWebhookProcessingError extends Error {
  readonly code = STRIPE_ERROR_CODES.STRIPE_WEBHOOK_PROCESSING_ERROR;
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status = 500, retryable = true) {
    super(message);
    this.name = "StripeWebhookProcessingError";
    this.status = status;
    this.retryable = retryable;
  }
}

export function isStripeWebhookSignatureError(
  error: unknown,
): error is StripeWebhookSignatureError {
  return error instanceof StripeWebhookSignatureError;
}

export function isStripeWebhookConfigError(error: unknown): error is StripeWebhookConfigError {
  return error instanceof StripeWebhookConfigError;
}

export function isStripeWebhookProcessingError(
  error: unknown,
): error is StripeWebhookProcessingError {
  return error instanceof StripeWebhookProcessingError;
}
