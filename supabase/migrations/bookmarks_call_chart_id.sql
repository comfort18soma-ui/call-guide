-- コール表ブックマーク用: bookmarks に call_chart_id を追加
-- call_charts.id が UUID のため call_chart_id は uuid。bigint の場合は型を変更してください。

alter table public.bookmarks alter column mix_id drop not null;

alter table public.bookmarks
  add column if not exists call_chart_id uuid null references public.call_charts(id) on delete cascade;

alter table public.bookmarks
  add constraint bookmarks_mix_or_call_chart
  check (
    (mix_id is not null and call_chart_id is null) or
    (mix_id is null and call_chart_id is not null)
  );

-- 既存の unique(user_id, mix_id) を削除し、部分一意に変更
alter table public.bookmarks drop constraint if exists bookmarks_user_id_mix_id_key;

create unique index if not exists bookmarks_user_id_mix_id_key
  on public.bookmarks (user_id, mix_id) where mix_id is not null;

create unique index if not exists bookmarks_user_id_call_chart_id_key
  on public.bookmarks (user_id, call_chart_id) where call_chart_id is not null;

create index if not exists bookmarks_call_chart_id_idx on public.bookmarks (call_chart_id);

comment on column public.bookmarks.call_chart_id is 'コール表ブックマーク時のみ設定。mix_id と排他';
