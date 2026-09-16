/**
 * Server-side public email masking for testimonials.
 * Never return the original input on failure — callers must use a generic identity.
 */

const CC_SECOND_LEVEL = new Set([
  "ac",
  "co",
  "com",
  "edu",
  "gob",
  "gov",
  "ltd",
  "me",
  "mil",
  "ne",
  "net",
  "or",
  "org",
  "plc",
  "sch",
]);

function maskSegment(segment: string): string {
  if (segment.length <= 2) {
    return segment;
  }
  return `${segment.slice(0, 2)}${"*".repeat(segment.length - 2)}`;
}

function suffixLabelCount(labels: string[]): number {
  if (labels.length < 2) {
    return labels.length;
  }

  const tld = labels[labels.length - 1] ?? "";
  const sld = labels[labels.length - 2] ?? "";
  if (labels.length >= 3 && tld.length === 2 && CC_SECOND_LEVEL.has(sld.toLowerCase())) {
    return 2;
  }

  return 1;
}

function isUsableDomainLabel(label: string): boolean {
  return label.length > 0 && !label.startsWith("-") && !label.endsWith("-");
}

/**
 * Mask a login email for public testimonial display.
 * Returns null when the value is missing or not safely maskable.
 */
export function maskEmailForPublicDisplay(email: unknown): string | null {
  if (typeof email !== "string") {
    return null;
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return null;
  }

  const separator = trimmed.indexOf("@");
  if (separator <= 0 || separator !== trimmed.lastIndexOf("@")) {
    return null;
  }

  const local = trimmed.slice(0, separator);
  const domain = trimmed.slice(separator + 1);
  if (!local || !domain || /\s/.test(local) || /\s/.test(domain)) {
    return null;
  }

  const localSegments = local.split(".");
  if (localSegments.some((segment) => segment.length === 0)) {
    return null;
  }

  const domainLabels = domain.split(".");
  if (domainLabels.length < 2 || domainLabels.some((label) => !isUsableDomainLabel(label))) {
    return null;
  }

  const suffixCount = suffixLabelCount(domainLabels);
  const identifying = domainLabels.slice(0, domainLabels.length - suffixCount);
  const suffix = domainLabels.slice(domainLabels.length - suffixCount);
  if (identifying.length === 0 || suffix.length === 0) {
    return null;
  }

  return `${localSegments.map(maskSegment).join(".")}@${[...identifying.map(maskSegment), ...suffix].join(".")}`;
}
