-- Supabase Migration: Utang & Bills Tracker Hybrid Schema
-- Follows Supabase Postgres Best Practices (RLS enabled, (select auth.uid()) caching, FK indexes)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'maria',
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- LOANS (UTANG) TABLE
create table if not exists public.loans (
  loan_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creditor_name text not null,
  amount numeric(10,2) not null default 0.00,
  term_type text not null default 'NONE' check (term_type in ('NONE', 'WEEKLY', 'MONTHLY')),
  weekly_day text check (weekly_day in ('mon', 'tues', 'wed', 'thur', 'fri', 'sat', 'sun')),
  monthly_day integer check (monthly_day between 1 and 31),
  due_date date,
  borrowed_date date not null default current_date,
  has_due_date boolean not null default true,
  details_notes text not null default '',
  status text not null default 'UNPAID' check (status in ('UNPAID', 'PAID')),
  is_deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists loans_user_id_idx on public.loans (user_id);
create index if not exists loans_due_date_idx on public.loans (due_date);

alter table public.loans enable row level security;

create policy "loans_select_own" on public.loans
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "loans_insert_own" on public.loans
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "loans_update_own" on public.loans
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "loans_delete_own" on public.loans
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- BILLS TABLE
create table if not exists public.bills (
  bill_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_name text not null,
  icon_type text not null default 'bolt' check (icon_type in ('bolt', 'droplet', 'wifi', 'home')),
  amount numeric(10,2) not null default 0.00,
  due_date date not null,
  is_paid boolean not null default false,
  is_deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists bills_user_id_idx on public.bills (user_id);

alter table public.bills enable row level security;

create policy "bills_select_own" on public.bills
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "bills_insert_own" on public.bills
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "bills_update_own" on public.bills
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "bills_delete_own" on public.bills
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- PAYMENT HISTORY TABLE
create table if not exists public.payment_history (
  history_id uuid primary key default gen_random_uuid(),
  loan_id uuid references public.loans(loan_id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  creditor_name text not null,
  event_type text not null default 'MARKED_PAID' check (event_type in ('CREATED', 'EDITED', 'INSTALLMENT_PAID', 'MARKED_PAID', 'BILL_PAID')),
  amount_paid numeric(10,2) not null default 0.00,
  note text,
  recorded_at timestamptz not null default now()
);

create index if not exists payment_history_user_id_idx on public.payment_history (user_id);
create index if not exists payment_history_loan_id_idx on public.payment_history (loan_id);

alter table public.payment_history enable row level security;

create policy "payment_history_select_own" on public.payment_history
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "payment_history_insert_own" on public.payment_history
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "payment_history_update_own" on public.payment_history
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
