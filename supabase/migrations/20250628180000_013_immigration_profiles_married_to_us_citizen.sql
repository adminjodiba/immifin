alter table public.immigration_profiles
  add column married_to_us_citizen boolean;

comment on column public.immigration_profiles.married_to_us_citizen is
  'Optional citizenship calculator preference: whether the user is married to a U.S. citizen.';
