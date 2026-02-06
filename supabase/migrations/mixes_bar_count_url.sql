-- mixes テーブル: bars 廃止、bar_count と url を追加
alter table public.mixes add column if not exists bar_count integer;
alter table public.mixes add column if not exists url text;

-- bars カラムを削除する場合は、データ移行後に実行
-- alter table public.mixes drop column if exists bars;
