alter table public.profiles enable row level security;
alter table public.immigration_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.admin_role_changes enable row level security;

-- Phase 1: all application access uses SUPABASE_SERVICE_ROLE_KEY from Next.js server routes.
-- Client-facing RLS policies are added in a later phase.
