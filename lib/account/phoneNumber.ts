import { AuthError } from "@/lib/auth/errors";
import {
  buildE164,
  parseE164Phone,
  resolveCountryCode,
  stripPhoneInput,
} from "@/lib/account/countryCodes";

const PHONE_INPUT_FORMAT = /^[\d\s+\-()]+$/;

export function validatePhoneContact(input: {
  countryCode: unknown;
  phoneLocalNumber: unknown;
  customCountryCode?: unknown;
}): string {
  if (input.countryCode === null || input.countryCode === undefined || input.countryCode === "") {
    throw new AuthError("countryCode is required.", 400);
  }

  if (typeof input.countryCode !== "string") {
    throw new AuthError("Invalid countryCode.", 400);
  }

  if (input.phoneLocalNumber === null || input.phoneLocalNumber === undefined) {
    throw new AuthError("phoneLocalNumber is required.", 400);
  }

  if (typeof input.phoneLocalNumber !== "string") {
    throw new AuthError("Invalid phoneLocalNumber.", 400);
  }

  const localTrimmed = stripPhoneInput(input.phoneLocalNumber.trim());
  if (localTrimmed === "") {
    throw new AuthError("phoneLocalNumber is required.", 400);
  }

  if (!PHONE_INPUT_FORMAT.test(localTrimmed)) {
    throw new AuthError(
      "phoneLocalNumber contains invalid characters. Use digits, spaces, +, -, or parentheses.",
      400,
    );
  }

  const customCountryCode =
    typeof input.customCountryCode === "string" ? input.customCountryCode.trim() : "";

  try {
    const resolvedCode = resolveCountryCode(input.countryCode, customCountryCode);
    return buildE164(resolvedCode, localTrimmed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid phone number.";
    throw new AuthError(message, 400);
  }
}

export function tryValidateE164Phone(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = parseE164Phone(value);
  if (!parsed) {
    return null;
  }

  try {
    return buildE164(parsed.countryCode, parsed.localNumber);
  } catch {
    return null;
  }
}
