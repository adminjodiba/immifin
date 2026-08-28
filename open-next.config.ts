import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/**
 * OpenNext Cloudflare persistent cache (S7A-PERF-003B).
 *
 * Status: CONFIGURED LOCALLY — NOT PRODUCTION DEPLOYED
 *
 * - R2: NEXT_INC_CACHE_R2_BUCKET → immifin-prod-opennext-inc-cache
 * - D1: NEXT_TAG_CACHE_D1 → immifin-prod-opennext-tag-cache
 * - DO: NEXT_CACHE_DO_QUEUE → DOQueueHandler
 *
 * Do not enable Cloudflare Workers Cache for HTML. Clerk middleware must keep
 * running before cache interception for protected routes.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: d1NextTagCache,
  enableCacheInterception: true,
});
