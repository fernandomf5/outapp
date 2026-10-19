-- Financeiro: abas independentes por negocio, sem alterar lancamentos existentes.
-- Deploy no Supabase antes de liberar a nova interface.
create table if not exists public.financial_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.financial_businesses(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  color text not null default '#39c5ff' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_folders_unique_name unique (user_id, business_id, name)
);

create index if not exists idx_financial_folders_owner_business
  on public.financial_folders(user_id,business_id,sort_order);

create or replace function public.financial_folder_guard() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  new.name := btrim(new.name);
  if not exists (
    select 1 from public.financial_businesses b
    where b.id = new.business_id and b.user_id = new.user_id
  ) then
    raise exception 'Aba financeira nao pertence ao negocio informado';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists financial_folders_guard on public.financial_folders;
create trigger financial_folders_guard
before insert or update on public.financial_folders
for each row execute function public.financial_folder_guard();

alter table public.financial_folders enable row level security;
drop policy if exists financial_folders_owner_select on public.financial_folders;
create policy financial_folders_owner_select on public.financial_folders
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists financial_folders_owner_insert on public.financial_folders;
create policy financial_folders_owner_insert on public.financial_folders
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists financial_folders_owner_update on public.financial_folders;
create policy financial_folders_owner_update on public.financial_folders
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists financial_folders_owner_delete on public.financial_folders;
create policy financial_folders_owner_delete on public.financial_folders
for delete to authenticated using (user_id = (select auth.uid()));

alter table public.financial_transactions
  add column if not exists folder_id uuid null;

-- NULL = contas antigas sem aba. Excluir uma aba nao apaga nenhum lancamento.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'financial_transactions_folder_id_fkey'
      and conrelid = 'public.financial_transactions'::regclass
  ) then
    alter table public.financial_transactions
      add constraint financial_transactions_folder_id_fkey
      foreign key (folder_id) references public.financial_folders(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_financial_transactions_folder
  on public.financial_transactions(folder_id) where folder_id is not null;

-- Nao aceita associar uma transacao a uma aba de outro usuario/negocio.
create or replace function public.financial_transaction_folder_guard()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.folder_id is not null and not exists (
    select 1 from public.financial_folders f
    where f.id = new.folder_id and f.user_id = new.user_id and f.business_id = new.business_id
  ) then
    raise exception 'Aba financeira nao pertence ao usuario e negocio da transacao';
  end if;
  return new;
end $$;

drop trigger if exists financial_transaction_folder_guard on public.financial_transactions;
create trigger financial_transaction_folder_guard
before insert or update of folder_id, user_id, business_id
on public.financial_transactions
for each row execute function public.financial_transaction_folder_guard();

comment on table public.financial_folders is
  'Abas financeiras personalizadas por negocio; separadas das categorias e contas bancarias.';
comment on column public.financial_transactions.folder_id is
  'NULL para movimentos anteriores ou nao categorizados em abas; nenhuma migracao destrutiva.';
