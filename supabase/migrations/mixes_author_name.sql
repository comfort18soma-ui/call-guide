-- MIXの作成者名を保存するカラムを追加
alter table public.mixes add column if not exists author_name text;

comment on column public.mixes.author_name is '作成者名（表示用）';
