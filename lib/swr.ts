export const visaBulletinSwrOptions = {
  dedupingInterval: 86_400_000,
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
} as const;

export const visaStampingSwrOptions = visaBulletinSwrOptions;

import { readJsonResponse, readJsonResponseBody } from "@/lib/http/readJsonResponse";

export async function jsonFetcher<T>(url: string, fallback = "Request failed."): Promise<T> {
  const response = await fetch(url);
  const result = await readJsonResponseBody<T>(response);

  if (!result.ok) {
    throw new Error(result.error ?? fallback);
  }

  return result.data;
}

export { readJsonResponse };
