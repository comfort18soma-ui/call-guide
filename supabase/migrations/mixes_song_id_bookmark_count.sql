-- 楽曲に紐づくコール（MIX）表示のため、mixes に song_id と bookmark_count を追加
-- ※ songs.id が uuid の場合は song_id を uuid に変更してください
alter table public.mixes add column if not exists song_id integer references public.songs(id) on delete set null;
alter table public.mixes add column if not exists bookmark_count integer not null default 0;

create index if not exists mixes_song_id_idx on public.mixes (song_id);
create index if not exists mixes_bookmark_count_idx on public.mixes (bookmark_count desc);

comment on column public.mixes.song_id is '紐づく楽曲ID（null の場合は辞典用の汎用MIX）';
comment on column public.mixes.bookmark_count is 'ブックマーク数（人気順ソート用）';
