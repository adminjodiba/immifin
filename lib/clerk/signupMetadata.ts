export const SIGNUP_METADATA_PHONE_KEY = "phoneNumber";
export const SIGNUP_METADATA_OPT_IN_KEY = "automatedAlertsOptIn";

export type SignupContactMetadata = {
  phoneNumber: string | null;
  automatedAlertsOptIn: boolean | null;
};

export function parseSignupContactMetadata(
  metadata: Record<string, unknown> | null | undefined,
): SignupContactMetadata {
  const phoneRaw = metadata?.[SIGNUP_METADATA_PHONE_KEY];
  const phoneNumber =
    typeof phoneRaw === "string" && phoneRaw.trim().length > 0 ? phoneRaw.trim() : null;

  const optInRaw = metadata?.[SIGNUP_METADATA_OPT_IN_KEY];
  const automatedAlertsOptIn = typeof optInRaw === "boolean" ? optInRaw : null;

  return { phoneNumber, automatedAlertsOptIn };
}

export function buildSignupContactMetadata(input: {
  phoneNumber: string;
  automatedAlertsOptIn: boolean;
}): Record<string, unknown> {
  return {
    [SIGNUP_METADATA_PHONE_KEY]: input.phoneNumber,
    [SIGNUP_METADATA_OPT_IN_KEY]: input.automatedAlertsOptIn,
  };
}
