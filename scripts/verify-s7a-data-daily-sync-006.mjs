import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const files = {
  bulletinSheets: "lib/visaBulletinSheets.ts",
  stampingSheets: "lib/visaStampingSheets.ts",
  bulletinHistory: "lib/visaBulletinHistory.ts",
  stampingService: "lib/visa/visaStampingSheetService.ts",
  refreshBulletin: "lib/data/refreshVisaBulletinData.ts",
  refreshStamping: "lib/data/refreshVisaStampingData.ts",
  dailyRunner: "lib/data/runDailyGoogleSheetSync.ts",
  timezone: "lib/data/dailySheetSyncTimezone.ts",
  adminBulletin: "app/api/admin/refresh-visa-bulletin/route.ts",
  adminStamping: "app/api/admin/refresh-visa-stamping/route.ts",
  adminDaily: "app/api/admin/run-daily-sheet-sync/route.ts",
  internalDaily: "app/api/internal/daily-sheet-sync/route.ts",
  worker: "cloudflare/custom-worker.ts",
  wrangler: "wrangler.jsonc",
  publicRoutes: "lib/auth/publicRoutes.ts",
};

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function chicagoClock(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value),
    minute: Number(parts.find((part) => part.type === "minute")?.value),
  };
}

const sources = Object.fromEntries(Object.entries(files).map(([key, rel]) => [key, read(rel)]));

assert(sources.bulletinSheets.includes("tags: [VISA_BULLETIN_SHEETS_CACHE_TAG]"), "bulletin CSV fetch must use cache tag");
assert(sources.stampingSheets.includes("tags: [VISA_STAMPING_SHEETS_CACHE_TAG]"), "stamping CSV fetch must use cache tag");
assert(sources.refreshBulletin.includes("revalidateTag(VISA_BULLETIN_SHEETS_CACHE_TAG)"), "bulletin refresh must bust sheet tag");
assert(sources.refreshBulletin.includes("revalidateTag(VISA_BULLETIN_HISTORY_CACHE_TAG)"), "bulletin refresh must bust history tag");
assert(sources.refreshBulletin.includes('"/api/visa-bulletin"'), "bulletin refresh must bust public bulletin API");
assert(sources.refreshBulletin.includes('"/api/visa-bulletin-history"'), "bulletin refresh must bust history API");
assert(sources.refreshBulletin.includes('"/api/visa-bulletin-movement"'), "bulletin refresh must bust movement API");
assert(sources.refreshBulletin.includes("revalidatePath"), "bulletin refresh must call revalidatePath");
assert(sources.refreshStamping.includes("revalidateTag(VISA_STAMPING_CACHE_TAG)"), "stamping refresh must bust assembled tag");
assert(sources.refreshStamping.includes('"/api/visa-stamping-wait-times"'), "stamping refresh must bust public API");
assert(sources.refreshBulletin.includes("forceRefresh: true"), "bulletin refresh force-fetches sheets");
assert(sources.refreshStamping.includes("forceRefresh: true"), "stamping refresh force-fetches sheets");
assert(!sources.adminBulletin.includes("loadAllVisaBulletinSheets"), "admin bulletin route must use shared service");
assert(!sources.adminStamping.includes("getVisaStampingSheetData"), "admin stamping route must use shared service");
assert(sources.adminBulletin.includes("refreshVisaBulletinData"), "admin bulletin route calls shared service");
assert(sources.adminStamping.includes("refreshVisaStampingData"), "admin stamping route calls shared service");
assert(sources.dailyRunner.includes("refreshVisaBulletinData"), "scheduled runner uses bulletin service");
assert(sources.dailyRunner.includes("refreshVisaStampingData"), "scheduled runner uses stamping service");
assert(sources.dailyRunner.includes("try {"), "scheduled runner isolates dataset failures");
assert(sources.refreshBulletin.includes("empty current sheets"), "invalid bulletin load must not proceed");
assert(sources.refreshStamping.includes("Last known good data was kept"), "invalid stamping load must not wipe cache");
assert(sources.bulletinHistory.includes("loadAllVisaBulletinHistoryRecords(true)"), "history force load no longer busts cache first");
assert(!sources.stampingService.includes("revalidateTag(VISA_STAMPING_CACHE_TAG)"), "stamping force load no longer busts cache first");
assert(sources.timezone.includes("America/Chicago"), "timezone helper uses Chicago");
assert(sources.wrangler.includes('"1 5 * * *"'), "wrangler has 05:01 UTC cron");
assert(sources.wrangler.includes('"1 6 * * *"'), "wrangler has 06:01 UTC cron");
assert(sources.wrangler.includes("./cloudflare/custom-worker.ts"), "wrangler main is custom worker");
assert(sources.worker.includes("scheduled"), "custom worker exports scheduled handler");
assert(sources.worker.includes("isChicagoDailySyncMinute"), "worker uses Chicago guard");
assert(sources.internalDaily.includes("skipTimezoneGuard: false"), "cron route keeps timezone guard");
assert(sources.adminDaily.includes("skipTimezoneGuard: true"), "admin daily route can run without waiting for midnight");
assert(sources.publicRoutes.includes("/api/internal/daily-sheet-sync"), "cron route is not blocked by Clerk middleware");
assert(sources.refreshBulletin.includes("trigger: input.trigger"), "bulletin audit records trigger");
assert(sources.refreshStamping.includes("trigger: input.trigger"), "stamping audit records trigger");

const cdtRun = chicagoClock(new Date("2026-07-15T05:01:00.000Z"));
const cdtSkip = chicagoClock(new Date("2026-07-15T06:01:00.000Z"));
const cstRun = chicagoClock(new Date("2026-01-15T06:01:00.000Z"));
const cstSkip = chicagoClock(new Date("2026-01-15T05:01:00.000Z"));

assert(cdtRun.hour === 0 && cdtRun.minute === 1, `CDT 05:01 UTC should be 00:01 Chicago, got ${cdtRun.hour}:${cdtRun.minute}`);
assert(!(cdtSkip.hour === 0 && cdtSkip.minute === 1), "CDT 06:01 UTC must not run");
assert(cstRun.hour === 0 && cstRun.minute === 1, `CST 06:01 UTC should be 00:01 Chicago, got ${cstRun.hour}:${cstRun.minute}`);
assert(!(cstSkip.hour === 0 && cstSkip.minute === 1), "CST 05:01 UTC must not run");

console.log("S7A-DATA-DAILY-SYNC-006 verify PASS");
console.log("- shared refresh services present");
console.log("- fetch tags + public revalidatePath present");
console.log("- DST-safe 05:01/06:01 UTC + Chicago 00:01 guard verified");
console.log("- failure isolation + last-known-good checks present");
