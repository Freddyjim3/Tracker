create extension if not exists pgcrypto;

create table if not exists public.user_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id text not null default 'default',
  projects jsonb not null default '[]'::jsonb,
  channels jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  project text,
  channel text,
  platform text,
  status text,
  priority text,
  created_at text,
  deadline text,
  publish_date text,
  tags jsonb not null default '[]'::jsonb,
  notes text,
  metrics jsonb not null default '{}'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_meta enable row level security;
alter table public.contents enable row level security;

create policy "user_meta_select_own" on public.user_meta
for select using (auth.uid() = user_id);

create policy "user_meta_insert_own" on public.user_meta
for insert with check (auth.uid() = user_id);

create policy "user_meta_update_own" on public.user_meta
for update using (auth.uid() = user_id);

create policy "user_meta_delete_own" on public.user_meta
for delete using (auth.uid() = user_id);

create policy "contents_select_own" on public.contents
for select using (auth.uid() = user_id);

create policy "contents_insert_own" on public.contents
for insert with check (auth.uid() = user_id);

create policy "contents_update_own" on public.contents
for update using (auth.uid() = user_id);

create policy "contents_delete_own" on public.contents
for delete using (auth.uid() = user_id);
