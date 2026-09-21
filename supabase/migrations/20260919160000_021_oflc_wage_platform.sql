-- S7A-SEO-H1BWAGE-003A: Official OFLC wage platform — empty schema foundation.
-- Empty tables only. No demo wages. No government CSV/XLSX/ZIP ingest.
-- Future public calculator access is via a controlled Next.js server/API layer,
-- not anonymous browser SELECT on these tables.

-- -----------------------------------------------------------------------------
-- 1. Shared lifecycle status (import packages / ZIP crosswalk versions)
-- -----------------------------------------------------------------------------

create type public.dataset_lifecycle_status as enum (
  'imported',
  'active',
  'archived',
  'failed'
);

-- -----------------------------------------------------------------------------
-- 2. wage_datasets
-- Multiple corrected/revised packages MAY share the same wage_year + data_source.
-- There is intentionally NO unique constraint on (wage_year) or
-- (wage_year, data_source). Only one ACTIVE row per data_source is allowed.
-- -----------------------------------------------------------------------------

create table public.wage_datasets (
  id uuid primary key default gen_random_uuid(),
  wage_year text not null,
  effective_start date not null,
  effective_end date not null,
  data_source text not null,
  package_filename text,
  package_sha256 text,
  source_url text,
  bls_survey text,
  soc_version text,
  status public.dataset_lifecycle_status not null default 'imported',
  imported_at timestamptz not null default now(),
  activated_at timestamptz,
  activated_by_clerk_user_id text,
  row_counts jsonb,
  validation_report jsonb,
  notes text,
  constraint wage_datasets_effective_range_check check (
    effective_end >= effective_start
  ),
  constraint wage_datasets_package_sha256_format_check check (
    package_sha256 is null
    or package_sha256 ~ '^[0-9A-Fa-f]{64}$'
  ),
  constraint wage_datasets_id_data_source_key unique (id, data_source)
);

comment on table public.wage_datasets is
  'OFLC wage package registry. Same wage_year may have multiple revised imports; at most one row per data_source may be active.';

comment on column public.wage_datasets.wage_year is
  'Official package year label (for example 2026-27). Not unique — corrected packages reuse the year.';

comment on column public.wage_datasets.data_source is
  'Package family, for example oflc_all_industries. Used by the one-active partial unique index.';

comment on column public.wage_datasets.activated_by_clerk_user_id is
  'Clerk user id of the admin who activated the package. Matches existing IMMIFIN clerk_user_id text convention.';

comment on column public.wage_datasets.row_counts is
  'Importer-supplied counts (occupations, areas, localities, wage rows). Not a live query cache.';

comment on column public.wage_datasets.validation_report is
  'Importer-supplied validation summary. No government source files are stored in this table.';

create unique index wage_datasets_one_active_per_data_source_idx
  on public.wage_datasets (data_source)
  where status = 'active';

create index wage_datasets_wage_year_idx
  on public.wage_datasets (wage_year, status);

-- -----------------------------------------------------------------------------
-- 3. oflc_occupations
-- Key: (dataset_id, soc_code). SOC stored as TEXT to preserve official formatting.
-- -----------------------------------------------------------------------------

create table public.oflc_occupations (
  dataset_id uuid not null references public.wage_datasets (id) on delete cascade,
  soc_code text not null,
  title text not null,
  description text,
  primary key (dataset_id, soc_code)
);

comment on table public.oflc_occupations is
  'Official OFLC SOC occupations for one imported wage package. TEXT soc_code preserves leading zeros and hyphenated codes.';

comment on column public.oflc_occupations.soc_code is
  'Official SOC code as published (TEXT). Never stored as integer.';

create index oflc_occupations_soc_code_idx
  on public.oflc_occupations (soc_code);

-- -----------------------------------------------------------------------------
-- 4. oflc_areas
-- Key: (dataset_id, area_code). area_code is TEXT (official codes may be 5, 6, or 7 digits).
-- -----------------------------------------------------------------------------

create table public.oflc_areas (
  dataset_id uuid not null references public.wage_datasets (id) on delete cascade,
  area_code text not null,
  area_name text not null,
  primary key (dataset_id, area_code)
);

comment on table public.oflc_areas is
  'Official OFLC wage areas for one imported package. area_code is TEXT so 5/6/7-digit codes keep leading zeros.';

comment on column public.oflc_areas.area_code is
  'Official OFLC Area code as published TEXT. Do not cast to integer.';

-- -----------------------------------------------------------------------------
-- 5. oflc_area_localities
-- Key: (dataset_id, area_code, state_ab, county_town_name).
-- county_fips is nullable (GU/VI and other territory handling).
-- -----------------------------------------------------------------------------

create table public.oflc_area_localities (
  dataset_id uuid not null,
  area_code text not null,
  state_ab text not null,
  state_name text not null,
  county_town_name text not null,
  county_fips text,
  primary key (dataset_id, area_code, state_ab, county_town_name),
  constraint oflc_area_localities_area_fk
    foreign key (dataset_id, area_code)
    references public.oflc_areas (dataset_id, area_code)
    on delete cascade,
  constraint oflc_area_localities_county_fips_format_check check (
    county_fips is null
    or county_fips ~ '^[0-9]{5}$'
  )
);

comment on table public.oflc_area_localities is
  'OFLC Geography.csv localities mapped to an Area. county_fips is nullable for territory rows that use a deterministic Area rule instead of a Census FIPS join.';

comment on column public.oflc_area_localities.county_fips is
  '5-digit Census county FIPS as TEXT (leading zeros preserved). Null when a FIPS join is not applicable.';

-- county_fips → OFLC Area lookup (scoped to the imported dataset)
create index oflc_area_localities_county_fips_idx
  on public.oflc_area_localities (dataset_id, county_fips)
  where county_fips is not null;

-- Cross-dataset FIPS probe used by importers / admin diagnostics
create index oflc_area_localities_county_fips_only_idx
  on public.oflc_area_localities (county_fips)
  where county_fips is not null;

create index oflc_area_localities_state_name_idx
  on public.oflc_area_localities (dataset_id, state_ab, county_town_name);

-- -----------------------------------------------------------------------------
-- 6. oflc_wage_records
-- Lookup key: (dataset_id, data_source, area_code, soc_code).
-- Published Level I–IV / average only. No user wage-level column.
-- label is unconstrained TEXT — official future packages may add values.
-- -----------------------------------------------------------------------------

create table public.oflc_wage_records (
  dataset_id uuid not null,
  data_source text not null,
  area_code text not null,
  soc_code text not null,
  geo_level smallint not null,
  level1 numeric(12, 2),
  level2 numeric(12, 2),
  level3 numeric(12, 2),
  level4 numeric(12, 2),
  average numeric(12, 2),
  label text,
  primary key (dataset_id, data_source, area_code, soc_code),
  constraint oflc_wage_records_dataset_source_fk
    foreign key (dataset_id, data_source)
    references public.wage_datasets (id, data_source)
    on delete cascade,
  constraint oflc_wage_records_area_fk
    foreign key (dataset_id, area_code)
    references public.oflc_areas (dataset_id, area_code)
    on delete cascade,
  constraint oflc_wage_records_occupation_fk
    foreign key (dataset_id, soc_code)
    references public.oflc_occupations (dataset_id, soc_code)
    on delete cascade,
  constraint oflc_wage_records_geo_level_check check (
    geo_level between 1 and 4
  )
);

comment on table public.oflc_wage_records is
  'Published OFLC wages for one package. Stores official Level I–IV / average only. Never stores a user wage level or submitted salary.';

comment on column public.oflc_wage_records.level1 is
  'Official published Level I wage. Nullable when the source cell is blank.';

comment on column public.oflc_wage_records.level2 is
  'Official published Level II wage. Nullable when the source cell is blank.';

comment on column public.oflc_wage_records.level3 is
  'Official published Level III wage. Nullable when the source cell is blank.';

comment on column public.oflc_wage_records.level4 is
  'Official published Level IV wage. Nullable when the source cell is blank.';

comment on column public.oflc_wage_records.average is
  'Official published average wage. Nullable when the source cell is blank.';

comment on column public.oflc_wage_records.label is
  'Official published wage-table label. TEXT with no value constraint so future OFLC labels are allowed.';

comment on column public.oflc_wage_records.geo_level is
  'Official GeoLvl 1–4.';

-- -----------------------------------------------------------------------------
-- 7. zip_crosswalk_versions
-- At most one ACTIVE HUD/ZIP crosswalk version in the database.
-- -----------------------------------------------------------------------------

create table public.zip_crosswalk_versions (
  id uuid primary key default gen_random_uuid(),
  hud_year integer not null,
  hud_quarter smallint not null,
  census_gazetteer_vintage text,
  package_sha256 text,
  status public.dataset_lifecycle_status not null default 'imported',
  imported_at timestamptz not null default now(),
  unmatched_locality_count integer,
  validation_report jsonb,
  constraint zip_crosswalk_versions_hud_quarter_check check (
    hud_quarter between 1 and 4
  ),
  constraint zip_crosswalk_versions_package_sha256_format_check check (
    package_sha256 is null
    or package_sha256 ~ '^[0-9A-Fa-f]{64}$'
  ),
  constraint zip_crosswalk_versions_unmatched_count_check check (
    unmatched_locality_count is null
    or unmatched_locality_count >= 0
  )
);

comment on table public.zip_crosswalk_versions is
  'Registry of HUD USPS ZIP–County (and related) crosswalk imports. At most one row may be active. No Census ZCTA seed is loaded by this migration.';

comment on column public.zip_crosswalk_versions.census_gazetteer_vintage is
  'Census Gazetteer vintage used when building county_fips_names for this import, for example 2026.';

create unique index zip_crosswalk_versions_one_active_idx
  on public.zip_crosswalk_versions (status)
  where status = 'active';

-- -----------------------------------------------------------------------------
-- 8. zip_county_crosswalk
-- Key: (crosswalk_version, zip, county_fips).
-- ZIP and county FIPS are TEXT so leading zeros are preserved.
-- Production source will be HUD USPS ZIP–County — this migration does not seed rows.
-- -----------------------------------------------------------------------------

create table public.zip_county_crosswalk (
  crosswalk_version uuid not null
    references public.zip_crosswalk_versions (id)
    on delete cascade,
  zip text not null,
  county_fips text not null,
  res_ratio numeric(16, 10),
  bus_ratio numeric(16, 10),
  oth_ratio numeric(16, 10),
  tot_ratio numeric(16, 10),
  pref_city text,
  pref_state text,
  source text,
  hud_year integer,
  hud_quarter smallint,
  primary key (crosswalk_version, zip, county_fips),
  constraint zip_county_crosswalk_zip_format_check check (
    zip ~ '^[0-9]{5}$'
  ),
  constraint zip_county_crosswalk_county_fips_format_check check (
    county_fips ~ '^[0-9]{5}$'
  ),
  constraint zip_county_crosswalk_hud_quarter_check check (
    hud_quarter is null
    or hud_quarter between 1 and 4
  ),
  constraint zip_county_crosswalk_ratio_range_check check (
    (res_ratio is null or (res_ratio >= 0 and res_ratio <= 1))
    and (bus_ratio is null or (bus_ratio >= 0 and bus_ratio <= 1))
    and (oth_ratio is null or (oth_ratio >= 0 and oth_ratio <= 1))
    and (tot_ratio is null or (tot_ratio >= 0 and tot_ratio <= 1))
  )
);

comment on table public.zip_county_crosswalk is
  'HUD USPS ZIP–County membership and ratios. Empty until a later importer runs. Not seeded with Census ZCTA stand-in data.';

comment on column public.zip_county_crosswalk.zip is
  '5-digit USPS ZIP as TEXT (leading zeros preserved).';

comment on column public.zip_county_crosswalk.county_fips is
  '5-digit county FIPS as TEXT (leading zeros preserved).';

create index zip_county_crosswalk_version_zip_idx
  on public.zip_county_crosswalk (crosswalk_version, zip);

-- -----------------------------------------------------------------------------
-- 9. county_fips_names
-- Key: (gazetteer_vintage, county_fips). Official legal county / county-equivalent names.
-- -----------------------------------------------------------------------------

create table public.county_fips_names (
  gazetteer_vintage text not null,
  county_fips text not null,
  state_ab text not null,
  name text not null,
  primary key (gazetteer_vintage, county_fips),
  constraint county_fips_names_county_fips_format_check check (
    county_fips ~ '^[0-9]{5}$'
  )
);

comment on table public.county_fips_names is
  'Official Census Gazetteer (or equivalent) legal county / county-equivalent names. Empty until a later importer runs.';

comment on column public.county_fips_names.county_fips is
  '5-digit county FIPS as TEXT (leading zeros preserved).';

comment on column public.county_fips_names.name is
  'Official legal name for the county or county-equivalent.';

create index county_fips_names_state_idx
  on public.county_fips_names (gazetteer_vintage, state_ab);

-- -----------------------------------------------------------------------------
-- 10. RLS — Phase 1 service-role only, no client policies
-- National wage / geography tables must not be readable by anon or authenticated
-- browser clients. The future public calculator will query through a controlled
-- Next.js server route that uses SUPABASE_SERVICE_ROLE_KEY.
-- Service role bypasses RLS. No GRANT/policy is added for anon or authenticated.
-- -----------------------------------------------------------------------------

alter table public.wage_datasets enable row level security;
alter table public.oflc_occupations enable row level security;
alter table public.oflc_areas enable row level security;
alter table public.oflc_area_localities enable row level security;
alter table public.oflc_wage_records enable row level security;
alter table public.zip_crosswalk_versions enable row level security;
alter table public.zip_county_crosswalk enable row level security;
alter table public.county_fips_names enable row level security;

-- Phase 1: all application access uses SUPABASE_SERVICE_ROLE_KEY from Next.js server routes.
-- Client-facing RLS policies are added in a later phase.
