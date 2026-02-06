-- ブックマーク: ユーザーがMIXを「覚えたい」または「お気に入り」に登録
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mix_id uuid not null references public.mixes(id) on delete cascade,
  category text not null check (category in ('practice', 'favorite')),
  created_at timestamptz not null default now(),
  unique(user_id, mix_id)
);

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
create index if not exists bookmarks_category_idx on public.bookmarks (category);
create index if not exists bookmarks_mix_id_idx on public.bookmarks (mix_id);

comment on table public.bookmarks is 'ユーザーが登録したMIX（覚えたい・お気に入り）';

-- フォロー: ユーザーがフォローする作成者名
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_author_name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, target_author_name)
);

create index if not exists follows_user_id_idx on public.follows (user_id);

comment on table public.follows is 'ユーザーがフォローしている作成者';

-- RLS
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;

create policy "Users can manage own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own follows"
  on public.follows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
