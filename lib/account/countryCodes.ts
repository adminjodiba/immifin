export const E164_MAX_LENGTH = 20;

export const KNOWN_DIAL_CODES = ["+971", "+91", "+61", "+44", "+1"] as const;

export type CountryCodePreset = {
  value: string;
  label: string;
};

export const COUNTRY_CODE_PRESETS: CountryCodePreset[] = [
  { value: "+1", label: "United States (+1)" },
  { value: "+1", label: "Canada (+1)" },
  { value: "+91", label: "India (+91)" },
  { value: "+44", label: "United Kingdom (+44)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+971", label: "UAE (+971)" },
  { value: "other", label: "Other / Manual" },
];

const LOCALE_DIAL_CODE: Record<string, string> = {
  "en-US": "+1",
  "en-CA": "+1",
  "en-IN": "+91",
  "en-GB": "+44",
  "en-AU": "+61",
};

export function stripPhoneInput(value: string): string {
  return value.replace(/[^\d+\-()\s]/g, "");
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseE164Phone(phone: string | null | undefined): {
  countryCode: string;
  localNumber: string;
} | null {
  if (!phone?.trim()) {
    return null;
  }

  const normalized = phone.trim().startsWith("+")
    ? `+${digitsOnly(phone)}`
    : digitsOnly(phone);

  if (!normalized.startsWith("+")) {
    return null;
  }

  for (const dialCode of KNOWN_DIAL_CODES) {
    if (normalized.startsWith(dialCode)) {
      return {
        countryCode: dialCode,
        localNumber: normalized.slice(dialCode.length),
      };
    }
  }

  const customMatch = normalized.match(/^(\+\d{1,4})(\d+)$/);
  if (!customMatch) {
    return null;
  }

  return {
    countryCode: customMatch[1],
    localNumber: customMatch[2],
  };
}

export function buildE164(countryCode: string, localNumber: string): string {
  const normalizedCode = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
  const localDigits = digitsOnly(localNumber);

  if (!/^\+\d{1,4}$/.test(normalizedCode)) {
    throw new Error("Invalid country code.");
  }

  if (!localDigits) {
    throw new Error("Phone number is required.");
  }

  const e164 = `${normalizedCode}${localDigits}`;

  if (e164.length > E164_MAX_LENGTH) {
    throw new Error(`Phone number must be at most ${E164_MAX_LENGTH} characters including country code.`);
  }

  return e164;
}

export function inferDefaultCountryCode(input: {
  savedPhone?: string | null;
  browserLocale?: string | null;
  immigrationCountry?: string | null;
}): { preset: string; customCode: string } {
  const parsed = parseE164Phone(input.savedPhone);
  if (parsed) {
    const isKnown = KNOWN_DIAL_CODES.includes(parsed.countryCode as (typeof KNOWN_DIAL_CODES)[number]);
    return {
      preset: isKnown ? parsed.countryCode : "other",
      customCode: isKnown ? "" : parsed.countryCode,
    };
  }

  const locale = input.browserLocale?.trim();
  if (locale && LOCALE_DIAL_CODE[locale]) {
    return { preset: LOCALE_DIAL_CODE[locale], customCode: "" };
  }

  if (input.immigrationCountry === "India") {
    return { preset: "+91", customCode: "" };
  }

  return { preset: "+1", customCode: "" };
}

export function resolveCountryCode(preset: string, customCode: string): string {
  if (preset === "other") {
    const trimmed = customCode.trim();
    if (!trimmed.startsWith("+")) {
      throw new Error("Custom country code must start with +.");
    }
    return trimmed;
  }

  return preset;
}
