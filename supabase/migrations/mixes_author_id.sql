-- 投稿者を profiles から取得するため、mixes に author_id を追加
alter table public.mixes add column if not exists author_id uuid references auth.users(id) on delete set null;
comment on column public.mixes.author_id is '投稿者（profiles.id と一致）';
