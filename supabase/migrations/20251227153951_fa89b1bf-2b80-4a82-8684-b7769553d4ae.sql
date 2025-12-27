-- Table to store team-member sessions (for validate/logout and 1-click access)
create table if not exists public.team_member_sessions (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create index if not exists idx_team_member_sessions_token on public.team_member_sessions(token);
create index if not exists idx_team_member_sessions_team_member_id on public.team_member_sessions(team_member_id);

alter table public.team_member_sessions enable row level security;

-- No RLS policies on purpose: only service-role (edge functions) should access this table.
