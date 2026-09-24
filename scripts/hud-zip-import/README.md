# HUD USPS ZIP–County loader

Official HUD 2026 Q2 ZIP–County source. Default is no-write.

```bash
npx tsx scripts/hud-zip-import/dry-run.ts
npx tsx scripts/hud-zip-import/loadHudDev.ts --target dev
npx tsx scripts/hud-zip-import/loadHudDev.ts --target production
npx tsx scripts/hud-zip-import/loadHudDev.ts --target dev --write
npx tsx scripts/hud-zip-import/loadHudDev.ts --target production --write --confirm-production
npx tsx scripts/hud-zip-import/loadHudDev.ts --target dev --write --resume --offset 35000
npx tsx scripts/hud-zip-import/loadHudDev.ts --target dev --verify-only
```

| Target | Project | SQL |
| --- | --- | --- |
| `dev` | `immifin Dev` / `vnhn...toxs` | `db query --linked` |
| `production` | `immifin production` / `pmkx...ysdv` | `db query --linked --project-ref` |

`--linked` is a Management API query flag. It is not `supabase link`. The repository stays linked to Dev.

Production writes require all of `--target production`, `--write`, `--confirm-production`, verified Production identity, approved HUD 2026 Q2 source/SHA/counts, and schema preflight. Resume remains Dev-only.

This loader inserts one non-active `zip_crosswalk_versions` row (`status=imported`) and 54,570 official `zip_county_crosswalk` rows. It does not populate `county_fips_names`, does not activate, and does not modify OFLC tables. Migration 021 has no `resolution_policy` column.
