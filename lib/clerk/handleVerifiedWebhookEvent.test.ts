import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { handleVerifiedClerkWebhookEvent } from "@/lib/clerk/handleVerifiedWebhookEvent";
import { WRITE_FREEZE_ENV, WRITE_FREEZE_MESSAGE } from "@/lib/platform/writeFreeze";

const originalFlag = process.env[WRITE_FREEZE_ENV];

afterEach(() => {
  if (originalFlag === undefined) {
    delete process.env[WRITE_FREEZE_ENV];
  } else {
    process.env[WRITE_FREEZE_ENV] = originalFlag;
  }
});

describe("handleVerifiedClerkWebhookEvent", () => {
  it("returns 503 and does not sync profiles when freeze is on", async () => {
    process.env[WRITE_FREEZE_ENV] = "true";
    const created = mock.fn(async () => {
      throw new Error("profile mutation must not run while frozen");
    });
    const deleted = mock.fn(async () => {
      throw new Error("profile mutation must not run while frozen");
    });

    const response = await handleVerifiedClerkWebhookEvent(
      {
        type: "user.updated",
        data: { id: "user_freeze_fixture" },
      },
      {
        syncClerkUserCreatedOrUpdated: created,
        syncClerkUserDeleted: deleted,
      },
    );

    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Retry-After"), "120");
    const body = (await response.json()) as { error?: string };
    assert.equal(body.error, WRITE_FREEZE_MESSAGE);
    assert.equal(created.mock.callCount(), 0);
    assert.equal(deleted.mock.callCount(), 0);
  });

  it("keeps existing unfrozen behavior for ignored events", async () => {
    delete process.env[WRITE_FREEZE_ENV];
    const created = mock.fn(async () => {
      throw new Error("ignored events must not sync");
    });

    const response = await handleVerifiedClerkWebhookEvent(
      {
        type: "session.created",
        data: { id: "sess_fixture" },
      },
      {
        syncClerkUserCreatedOrUpdated: created,
      },
    );

    assert.equal(response.status, 200);
    const body = (await response.json()) as { success?: boolean; type?: string };
    assert.equal(body.success, true);
    assert.equal(body.type, "session.created");
    assert.equal(created.mock.callCount(), 0);
  });
});
