import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthError } from "@/lib/auth/errors";
import { WRITE_FREEZE_MESSAGE, WriteFrozenError } from "@/lib/platform/writeFreeze";
import { authErrorResponse } from "./http";

describe("authErrorResponse", () => {
  it("maps WriteFrozenError to 503 maintenance without exposing internals", async () => {
    const response = authErrorResponse(new WriteFrozenError());
    assert.equal(response.status, 503);
    const body = (await response.json()) as { error?: string };
    assert.equal(body.error, WRITE_FREEZE_MESSAGE);
  });

  it("does not convert auth errors into maintenance responses", async () => {
    const response = authErrorResponse(new AuthError("Authentication required.", 401));
    assert.equal(response.status, 401);
    const body = (await response.json()) as { error?: string };
    assert.equal(body.error, "Authentication required.");
  });
});
