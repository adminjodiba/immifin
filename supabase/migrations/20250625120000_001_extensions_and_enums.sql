create extension if not exists "pgcrypto";

create type public.app_user_role as enum ('user', 'admin');

create type public.app_plan as enum ('free', 'basic', 'pro');

create type public.profile_status as enum ('active', 'suspended', 'deleted');

create type public.subscription_status as enum (
  'inactive',
  'trialing',
  'active',
  'past_due',
  'canceled'
);
