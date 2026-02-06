-- 1曲分のコール表（複数セクションの親）
create table if not exists public.call_charts (
  id uuid primary key default gen_random_uuid(),
  song_id integer not null references public.songs(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  title text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists call_charts_song_id_idx on public.call_charts (song_id);
create index if not exists call_charts_status_idx on public.call_charts (status);
create index if not exists call_charts_created_at_idx on public.call_charts (created_at desc);

comment on table public.call_charts is '1曲分のコール表申請（複数行＝call_sections）';

alter table public.call_charts enable row level security;

create policy "Anyone can insert call_charts"
  on public.call_charts for insert with check (true);

create policy "Anyone can select call_charts"
  on public.call_charts for select using (true);
