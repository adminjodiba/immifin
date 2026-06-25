export const visaBulletinSwrOptions = {
  dedupingInterval: 86_400_000,
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
} as const;

export async function jsonFetcher<T>(url: string, fallback = "Request failed."): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? fallback);
  }

  return response.json() as Promise<T>;
}
