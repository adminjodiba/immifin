# OFLC wage import

Official OFLC `OFLC_Wages_2026-27.zip` (All Industries only). One importer
architecture with explicit environment targeting.

Default is **no-write**. The importer never activates a dataset.

## Commands

```powershell
# Offline parser dry-run (no database)
npx tsx scripts/oflc-wage-import/dry-run.ts
npm run oflc:import:dry-run

# Dev no-write validation (uses the repository Dev CLI link)
npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target dev
npm run oflc:load:dry-run

# Authorized Dev write. Creates status=imported only.
npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target dev --write

# Authorized Dev resume of remaining wage rows into an existing failed dataset.
npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target dev --write --resume --offset 418000

# Production no-write / dry-run. Uses --linked --project-ref. Does not relink this repo.
npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target production
npm run oflc:load:prod:dry-run

# Production write is intentionally NOT a package.json script.
# All gates required. Do not run unless a later Product Owner task authorizes it.
# npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target production --write --confirm-production
```

## Targets

| `--target` | Approved identity | Execution |
|---|---|---|
| `dev` | `immifin Dev` / `vnhn...toxs` | `--linked` (this repo stays Dev-linked) |
| `production` | `immifin production` / `pmkx...ysdv` | `db query --linked --project-ref`. Never `supabase link`. |

`--target` is required. Credentials alone never select Production.

## Production write gates

A Production write requires **all** of:

1. `--target production`
2. `--write`
3. verified Production project ref `pmkx...ysdv`
4. `--confirm-production`
5. source SHA/count/schema validation
6. Production 021 schema preflight

If any gate fails: **zero writes**. `--write` without `--target production` cannot reach Production. `--target production` without `--write` is dry-run only.

## Lifecycle

- Creates `imported` or `failed` only.
- Never sets `active`.
- Never archives or replaces an ACTIVE All Industries dataset.
- Same package SHA will not silently duplicate.
- Resume uses the same target/write/confirmation gates as a fresh write.

## Expected official package

- Filename: `OFLC_Wages_2026-27.zip`
- All Industries
- Wage year `2026-27`
- Effective `2026-07-01` through `2027-06-30`
- BLS May 2025 OEWS / 2018 SOC
- 848 occupations, 530 areas, 3,275 localities, 449,440 wage records

Do not apply migrations from this directory. Do not activate from this directory.
