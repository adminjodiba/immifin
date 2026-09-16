// @ts-ignore `.open-next/worker.js` is generated at OpenNext build time
import { default as handler } from "../.open-next/worker.js";
import { isChicagoDailySyncMinute } from "../lib/data/dailySheetSyncTimezone";

type DailySyncEnv = {
  DAILY_SHEET_SYNC_SECRET?: string;
  WORKER_SELF_REFERENCE?: { fetch: (request: Request) => Promise<Response> };
};

async function invokeDailySheetSync(env: DailySyncEnv): Promise<void> {
  if (!isChicagoDailySyncMinute()) {
    return;
  }

  const secret = env.DAILY_SHEET_SYNC_SECRET?.trim();
  if (!secret) {
    console.warn("[daily-sheet-sync] scheduled trigger ignored because DAILY_SHEET_SYNC_SECRET is unset.");
    return;
  }

  const request = new Request("https://internal/api/internal/daily-sheet-sync", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
  });

  const response = env.WORKER_SELF_REFERENCE
    ? await env.WORKER_SELF_REFERENCE.fetch(request)
    : await fetch(request);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Daily sheet sync failed (${response.status}): ${detail.slice(0, 300)}`);
  }
}

export default {
  fetch: handler.fetch,

  async scheduled(_controller: unknown, env: DailySyncEnv, ctx: { waitUntil: (promise: Promise<unknown>) => void }) {
    ctx.waitUntil(invokeDailySheetSync(env));
  },
};
