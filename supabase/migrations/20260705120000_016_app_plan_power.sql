-- Add Power tier to app_plan for development subscription mode and future Stripe billing.
alter type public.app_plan add value if not exists 'power';
