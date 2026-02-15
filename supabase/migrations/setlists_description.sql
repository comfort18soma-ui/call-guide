-- setlists に備考（説明文）用カラムを追加
alter table public.setlists add column if not exists description text;
