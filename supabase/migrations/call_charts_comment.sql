-- call_charts に備考（コメント）用カラムを追加
alter table public.call_charts add column if not exists comment text;
