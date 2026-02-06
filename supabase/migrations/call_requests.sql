-- 楽曲ごとのコール投稿（管理者承認待ち）
create table if not exists public.call_requests (
  id uuid primary key default gen_random_uuid(),
  song_id integer not null references public.songs(id) on delete cascade,
  author_name text,
  section text,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

create index if not exists call_requests_song_id_idx on public.call_requests (song_id);
create index if not exists call_requests_status_idx on public.call_requests (status);
create index if not exists call_requests_created_at_idx on public.call_requests (created_at desc);

comment on table public.call_requests is '楽曲に紐づくコール投稿（承認後にmixes等へ反映）';

alter table public.call_requests enable row level security;

create policy "Anyone can insert call_requests"
  on public.call_requests for insert
  with check (true);

create policy "Anyone can select call_requests"
  on public.call_requests for select
  using (true);
