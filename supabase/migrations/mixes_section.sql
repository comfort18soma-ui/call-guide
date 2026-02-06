-- コール表の「場所」表示用: mixes に section を追加
alter table public.mixes add column if not exists section text;
comment on column public.mixes.section is 'コール表での表示用（例: イントロ, 1番Aメロ）';
