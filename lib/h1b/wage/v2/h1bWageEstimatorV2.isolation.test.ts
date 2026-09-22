import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { listPublicSitemapPaths } from "@/app/sitemap";

describe("H-1B Wage Estimator V2 removal", () => {
  it("temporary V2 route and component are gone", () => {
    assert.equal(existsSync(join(process.cwd(), "app/immigration/h1b-wage-level-estimator-v2/page.tsx")), false);
    assert.equal(existsSync(join(process.cwd(), "components/H1bWageLevelEstimatorV2.tsx")), false);
    assert.equal(listPublicSitemapPaths().includes("/immigration/h1b-wage-level-estimator-v2"), false);
    assert.equal(listPublicSitemapPaths().includes("/immigration/h1b-wage-level-estimator"), true);

    const menuFiles = [
      "lib/immigration-menu.ts",
      "lib/calculator-menu.ts",
      "lib/landing-v3-nav.ts",
      "lib/data/calculators.ts",
      "lib/data/landing-v2.ts",
      "components/SiteShell.tsx",
      "lib/auth/publicRoutes.ts",
    ];
    for (const file of menuFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      assert.equal(source.includes("h1b-wage-level-estimator-v2"), false, file);
    }
  });
});
