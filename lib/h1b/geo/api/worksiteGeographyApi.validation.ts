import {
  WORKSITE_GEOGRAPHY_ALLOWED_BODY_KEYS,
  WORKSITE_GEOGRAPHY_API_MAX_BODY_BYTES,
  type WorksiteGeographyApiRequest,
} from "@/lib/h1b/geo/api/worksiteGeographyApi.types";

export class WorksiteGeographyApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WorksiteGeographyApiRequestError";
    this.status = status;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertWorksiteGeographyContentType(request: Request): void {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    throw new WorksiteGeographyApiRequestError("Content-Type must be application/json.", 400);
  }
}

export async function readWorksiteGeographyJsonBody(request: Request): Promise<unknown> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > WORKSITE_GEOGRAPHY_API_MAX_BODY_BYTES) {
      throw new WorksiteGeographyApiRequestError("Request body is too large.", 413);
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    throw new WorksiteGeographyApiRequestError("Request body must be valid JSON.", 400);
  }

  if (raw.length > WORKSITE_GEOGRAPHY_API_MAX_BODY_BYTES) {
    throw new WorksiteGeographyApiRequestError("Request body is too large.", 413);
  }

  if (!raw.trim()) {
    throw new WorksiteGeographyApiRequestError("Request body is required.", 400);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new WorksiteGeographyApiRequestError("Request body must be valid JSON.", 400);
  }
}

/**
 * Request-contract validation only. Does not normalize ZIP or county FIPS.
 * Rejects unknown fields, including area_code and client dataset selectors.
 */
export function validateWorksiteGeographyRequest(body: unknown): WorksiteGeographyApiRequest {
  if (!isPlainObject(body)) {
    throw new WorksiteGeographyApiRequestError("Request body must be a JSON object.", 400);
  }

  const allowed = new Set<string>(WORKSITE_GEOGRAPHY_ALLOWED_BODY_KEYS);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      throw new WorksiteGeographyApiRequestError("Request contains unsupported fields.", 400);
    }
  }

  if (!("zip" in body)) {
    throw new WorksiteGeographyApiRequestError("zip is required.", 400);
  }

  if (typeof body.zip !== "string") {
    throw new WorksiteGeographyApiRequestError("zip must be a string.", 400);
  }

  if ("county_fips" in body && typeof body.county_fips !== "string") {
    throw new WorksiteGeographyApiRequestError("county_fips must be a string.", 400);
  }

  const request: WorksiteGeographyApiRequest = { zip: body.zip };
  if ("county_fips" in body) {
    request.countyFips = body.county_fips as string;
  }
  return request;
}
