import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  WRITE_FREEZE_CODE,
  WRITE_FREEZE_ENV,
  isMutatingSupabaseRpc,
  isWriteFreezeEnabled,
  isWriteFrozenError,
  WriteFrozenError,
} from "./writeFreeze";

const originalFlag = process.env[WRITE_FREEZE_ENV];

afterEach(() => {
  if (originalFlag === undefined) {
    delete process.env[WRITE_FREEZE_ENV];
  } else {
    process.env[WRITE_FREEZE_ENV] = originalFlag;
  }
});

describe("isWriteFreezeEnabled", () => {
  it("treats missing as off", () => {
    delete process.env[WRITE_FREEZE_ENV];
    assert.equal(isWriteFreezeEnabled(), false);
  });

  it("treats empty, false, 0, and garbage as off", () => {
    for (const value of ["", "false", "FALSE", "0", "off", "yes", "2"]) {
      process.env[WRITE_FREEZE_ENV] = value;
      assert.equal(isWriteFreezeEnabled(), false, value);
    }
  });

  it("treats true / TRUE / 1 as on, including surrounding whitespace", () => {
    process.env[WRITE_FREEZE_ENV] = "true";
    assert.equal(isWriteFreezeEnabled(), true);
    process.env[WRITE_FREEZE_ENV] = "TRUE";
    assert.equal(isWriteFreezeEnabled(), true);
    process.env[WRITE_FREEZE_ENV] = "1";
    assert.equal(isWriteFreezeEnabled(), true);
    process.env[WRITE_FREEZE_ENV] = "  True  ";
    assert.equal(isWriteFreezeEnabled(), true);
  });
});

describe("WriteFrozenError", () => {
  it("is identifiable by class and code", () => {
    const error = new WriteFrozenError();
    assert.equal(error.code, WRITE_FREEZE_CODE);
    assert.equal(error.status, 503);
    assert.equal(isWriteFrozenError(error), true);
    assert.equal(isWriteFrozenError(new Error("other")), false);
  });
});

describe("isMutatingSupabaseRpc", () => {
  it("blocks known 001-020 mutating RPCs and allows unknown names", () => {
    assert.equal(isMutatingSupabaseRpc("upsert_profile_from_clerk"), true);
    assert.equal(isMutatingSupabaseRpc("soft_delete_profile_by_clerk_id"), true);
    assert.equal(isMutatingSupabaseRpc("set_profile_role"), true);
    assert.equal(isMutatingSupabaseRpc("claim_stripe_webhook_event"), true);
    assert.equal(isMutatingSupabaseRpc("complete_stripe_webhook_event"), true);
    assert.equal(isMutatingSupabaseRpc("fail_stripe_webhook_event"), true);
    assert.equal(isMutatingSupabaseRpc("sanitize_stripe_webhook_error_message"), false);
  });
});
