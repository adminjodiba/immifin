import { OFFICIAL_SOC_CODE_RE } from "@/lib/h1b/wage/officialWageLookup.types";
import {
  EDUCATION_LEVELS,
  EXPERIENCE_RANGES,
  OFFICIAL_ESTIMATE_ALLOWED_BODY_KEYS,
  OFFICIAL_ESTIMATE_API_MAX_BODY_BYTES,
  type OfficialEstimateRequest,
} from "@/lib/h1b/wage/estimator/officialEstimate.types";
import type { EducationLevel, ExperienceRange } from "@/lib/h1b/wage/estimatorDisplay.types";

export class OfficialEstimateApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OfficialEstimateApiRequestError";
    this.status = status;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertOfficialEstimateContentType(request: Request): void {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    throw new OfficialEstimateApiRequestError("Content-Type must be application/json.", 400);
  }
}

export async function readOfficialEstimateJsonBody(request: Request): Promise<unknown> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > OFFICIAL_ESTIMATE_API_MAX_BODY_BYTES) {
      throw new OfficialEstimateApiRequestError("Request body is too large.", 413);
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    throw new OfficialEstimateApiRequestError("Request body must be valid JSON.", 400);
  }

  if (raw.length > OFFICIAL_ESTIMATE_API_MAX_BODY_BYTES) {
    throw new OfficialEstimateApiRequestError("Request body is too large.", 413);
  }

  if (!raw.trim()) {
    throw new OfficialEstimateApiRequestError("Request body is required.", 400);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new OfficialEstimateApiRequestError("Request body must be valid JSON.", 400);
  }
}

function isExperienceRange(value: unknown): value is ExperienceRange {
  return typeof value === "string" && (EXPERIENCE_RANGES as readonly string[]).includes(value);
}

function isEducationLevel(value: unknown): value is EducationLevel {
  return typeof value === "string" && (EDUCATION_LEVELS as readonly string[]).includes(value);
}

/**
 * Request-contract validation only.
 * Rejects unknown fields, including area_code and any client-calculated outputs.
 */
export function validateOfficialEstimateRequest(body: unknown): OfficialEstimateRequest {
  if (!isPlainObject(body)) {
    throw new OfficialEstimateApiRequestError("Request body must be a JSON object.", 400);
  }

  const allowed = new Set<string>(OFFICIAL_ESTIMATE_ALLOWED_BODY_KEYS);
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      throw new OfficialEstimateApiRequestError("Request contains unsupported fields.", 400);
    }
  }

  if (!("soc_code" in body)) {
    throw new OfficialEstimateApiRequestError("soc_code is required.", 400);
  }
  if (typeof body.soc_code !== "string") {
    throw new OfficialEstimateApiRequestError("soc_code must be a string.", 400);
  }
  if (!OFFICIAL_SOC_CODE_RE.test(body.soc_code)) {
    throw new OfficialEstimateApiRequestError("soc_code must be a 2018 SOC code (##-####).", 400);
  }

  if (!("zip" in body)) {
    throw new OfficialEstimateApiRequestError("zip is required.", 400);
  }
  if (typeof body.zip !== "string") {
    throw new OfficialEstimateApiRequestError("zip must be a string.", 400);
  }

  if ("county_fips" in body && typeof body.county_fips !== "string") {
    throw new OfficialEstimateApiRequestError("county_fips must be a string.", 400);
  }

  if (!("annual_salary" in body)) {
    throw new OfficialEstimateApiRequestError("annual_salary is required.", 400);
  }
  if (typeof body.annual_salary !== "number" || !Number.isFinite(body.annual_salary) || body.annual_salary <= 0) {
    throw new OfficialEstimateApiRequestError("annual_salary must be a number greater than 0.", 400);
  }

  if (!("experience" in body)) {
    throw new OfficialEstimateApiRequestError("experience is required.", 400);
  }
  if (!isExperienceRange(body.experience)) {
    throw new OfficialEstimateApiRequestError("experience must be 0-1, 2-3, 4-6, 7-10, or 10+.", 400);
  }

  if (!("education" in body)) {
    throw new OfficialEstimateApiRequestError("education is required.", 400);
  }
  if (!isEducationLevel(body.education)) {
    throw new OfficialEstimateApiRequestError("education must be Bachelor, Master, PhD, or Other.", 400);
  }

  const request: OfficialEstimateRequest = {
    socCode: body.soc_code,
    zip: body.zip,
    annualSalary: body.annual_salary,
    experience: body.experience,
    education: body.education,
  };
  if ("county_fips" in body) {
    request.countyFips = body.county_fips as string;
  }
  return request;
}
