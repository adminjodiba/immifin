import {
  OFFICIAL_SOC_CODE_RE,
  OFFICIAL_WAGE_LOOKUP_ALLOWED_BODY_KEYS,
  OFFICIAL_WAGE_LOOKUP_API_MAX_BODY_BYTES,
  type OfficialWageLookupRequest,
} from "@/lib/h1b/wage/officialWageLookup.types";

export class OfficialWageLookupApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OfficialWageLookupApiRequestError";
    this.status = status;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertOfficialWageLookupContentType(request: Request): void {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    throw new OfficialWageLookupApiRequestError("Content-Type must be application/json.", 400);
  }
}

export async function readOfficialWageLookupJsonBody(request: Request): Promise<unknown> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > OFFICIAL_WAGE_LOOKUP_API_MAX_BODY_BYTES) {
      throw new OfficialWageLookupApiRequestError("Request body is too large.", 413);
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    throw new OfficialWageLookupApiRequestError("Request body must be valid JSON.", 400);
  }

  if (raw.length > OFFICIAL_WAGE_LOOKUP_API_MAX_BODY_BYTES) {
    throw new OfficialWageLookupApiRequestError("Request body is too large.", 413);
  }

  if (!raw.trim()) {
    throw new OfficialWageLookupApiRequestError("Request body is required.", 400);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new OfficialWageLookupApiRequestError("Request body must be valid JSON.", 400);
  }
}

/**
 * Request-contract validation only.
 * Rejects unknown fields, including area_code. Does not normalize ZIP/county.
 * SOC format is the official 2018 ##-#### used by the OFLC dataset.
 */
export function validateOfficialWageLookupRequest(body: unknown): OfficialWageLookupRequest {
  if (!isPlainObject(body)) {
    throw new OfficialWageLookupApiRequestError("Request body must be a JSON object.", 400);
  }

  const allowed = new Set<string>(OFFICIAL_WAGE_LOOKUP_ALLOWED_BODY_KEYS);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      throw new OfficialWageLookupApiRequestError("Request contains unsupported fields.", 400);
    }
  }

  if (!("soc_code" in body)) {
    throw new OfficialWageLookupApiRequestError("soc_code is required.", 400);
  }
  if (typeof body.soc_code !== "string") {
    throw new OfficialWageLookupApiRequestError("soc_code must be a string.", 400);
  }
  if (!OFFICIAL_SOC_CODE_RE.test(body.soc_code)) {
    throw new OfficialWageLookupApiRequestError("soc_code must be a 2018 SOC code (##-####).", 400);
  }

  if (!("zip" in body)) {
    throw new OfficialWageLookupApiRequestError("zip is required.", 400);
  }
  if (typeof body.zip !== "string") {
    throw new OfficialWageLookupApiRequestError("zip must be a string.", 400);
  }

  if ("county_fips" in body && typeof body.county_fips !== "string") {
    throw new OfficialWageLookupApiRequestError("county_fips must be a string.", 400);
  }

  const request: OfficialWageLookupRequest = {
    socCode: body.soc_code,
    zip: body.zip,
  };
  if ("county_fips" in body) {
    request.countyFips = body.county_fips as string;
  }
  return request;
}
