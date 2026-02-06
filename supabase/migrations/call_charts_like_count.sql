-- コール表のいいね数: bookmarks (call_chart_id) の件数を保持
alter table public.call_charts add column if not exists like_count integer not null default 0;

create index if not exists call_charts_like_count_idx on public.call_charts (like_count desc);

comment on column public.call_charts.like_count is 'このコール表へのブックマーク（いいね）数';

-- 既存データの like_count を bookmarks から集計して更新
update public.call_charts c
set like_count = (
  select count(*)::int from public.bookmarks b
  where b.call_chart_id = c.id
);

-- bookmarks の insert/delete で call_charts.like_count を更新するトリガー
create or replace function public.sync_call_chart_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' and new.call_chart_id is not null then
    update public.call_charts set like_count = like_count + 1 where id = new.call_chart_id;
  elsif tg_op = 'DELETE' and old.call_chart_id is not null then
    update public.call_charts set like_count = greatest(0, like_count - 1) where id = old.call_chart_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists bookmarks_sync_call_chart_like_count on public.bookmarks;
create trigger bookmarks_sync_call_chart_like_count
  after insert or delete on public.bookmarks
  for each row execute function public.sync_call_chart_like_count();
