function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!isJsonResponse(response)) {
    throw new Error(
      `Expected JSON response but received ${response.status} ${response.headers.get("content-type") ?? "unknown content-type"}.`,
    );
  }

  return response.json() as Promise<T>;
}

export async function readJsonResponseBody<T>(
  response: Response,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!response.ok) {
    if (isJsonResponse(response)) {
      const payload = (await response.json()) as { error?: string };
      return { ok: false, error: payload.error ?? `Request failed (${response.status}).` };
    }

    return {
      ok: false,
      error: `Request failed (${response.status}) with non-JSON response.`,
    };
  }

  try {
    const data = await readJsonResponse<T>(response);
    return { ok: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid JSON response.";
    return { ok: false, error: message };
  }
}
