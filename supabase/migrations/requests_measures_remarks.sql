-- MIXリクエスト用: 小節数 (integer) と備考 (text) を追加
alter table public.requests add column if not exists measures integer;
alter table public.requests add column if not exists remarks text;

comment on column public.requests.measures is 'MIXリクエストの小節数';
comment on column public.requests.remarks is 'MIXリクエストの備考';
