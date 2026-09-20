import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { WRITE_FREEZE_ENV, WriteFrozenError } from "@/lib/platform/writeFreeze";
import { applyWriteFreezeGuard } from "./writeFreezeGuard";

const originalFlag = process.env[WRITE_FREEZE_ENV];

afterEach(() => {
  if (originalFlag === undefined) {
    delete process.env[WRITE_FREEZE_ENV];
  } else {
    process.env[WRITE_FREEZE_ENV] = originalFlag;
  }
});

function createMockClient() {
  const calls = {
    select: 0,
    insert: 0,
    update: 0,
    upsert: 0,
    delete: 0,
    rpc: [] as string[],
  };

  const client = {
    from(_table?: string) {
      return {
        select(..._args: unknown[]) {
          calls.select += 1;
          return { data: [], error: null };
        },
        insert(..._args: unknown[]) {
          calls.insert += 1;
          return { data: null, error: null };
        },
        update(..._args: unknown[]) {
          calls.update += 1;
          return {
            eq(..._eqArgs: unknown[]) {
              return { data: null, error: null };
            },
          };
        },
        upsert(..._args: unknown[]) {
          calls.upsert += 1;
          return { data: null, error: null };
        },
        delete(..._args: unknown[]) {
          calls.delete += 1;
          return { data: null, error: null };
        },
      };
    },
    rpc(name: string) {
      calls.rpc.push(name);
      return { data: null, error: null };
    },
  };

  return { client, calls };
}

describe("applyWriteFreezeGuard", () => {
  it("allows reads and writes when freeze is off", () => {
    delete process.env[WRITE_FREEZE_ENV];
    const { client, calls } = createMockClient();
    const guarded = applyWriteFreezeGuard(client);

    guarded.from("profiles").select();
    guarded.from("profiles").insert();
    guarded.from("profiles").update().eq();
    guarded.from("profiles").upsert();
    guarded.from("profiles").delete();
    guarded.rpc("upsert_profile_from_clerk");
    guarded.rpc("sanitize_stripe_webhook_error_message");

    assert.equal(calls.select, 1);
    assert.equal(calls.insert, 1);
    assert.equal(calls.update, 1);
    assert.equal(calls.upsert, 1);
    assert.equal(calls.delete, 1);
    assert.deepEqual(calls.rpc, [
      "upsert_profile_from_clerk",
      "sanitize_stripe_webhook_error_message",
    ]);
  });

  it("blocks mutations and mutating RPCs when freeze is on, and still allows select", () => {
    process.env[WRITE_FREEZE_ENV] = "true";
    const { client, calls } = createMockClient();
    const guarded = applyWriteFreezeGuard(client);

    guarded.from("profiles").select();
    assert.equal(calls.select, 1);

    assert.throws(() => guarded.from("profiles").insert(), WriteFrozenError);
    assert.throws(() => guarded.from("profiles").update(), WriteFrozenError);
    assert.throws(() => guarded.from("profiles").upsert(), WriteFrozenError);
    assert.throws(() => guarded.from("profiles").delete(), WriteFrozenError);
    assert.throws(() => guarded.rpc("claim_stripe_webhook_event"), WriteFrozenError);
    guarded.rpc("sanitize_stripe_webhook_error_message");

    assert.equal(calls.insert, 0);
    assert.equal(calls.update, 0);
    assert.equal(calls.upsert, 0);
    assert.equal(calls.delete, 0);
    assert.deepEqual(calls.rpc, ["sanitize_stripe_webhook_error_message"]);
  });

  it("blocks hidden activity writes (last_seen_at update) while leaving select usable", () => {
    process.env[WRITE_FREEZE_ENV] = "true";
    const { client, calls } = createMockClient();
    const guarded = applyWriteFreezeGuard(client);

    guarded.from("profiles").select();
    assert.throws(
      () => guarded.from("profiles").update({ last_seen_at: "fixture" }),
      WriteFrozenError,
    );
    assert.equal(calls.select, 1);
    assert.equal(calls.update, 0);
  });
});

