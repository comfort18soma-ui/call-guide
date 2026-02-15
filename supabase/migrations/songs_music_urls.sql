-- songs テーブルに YouTube / Apple Music / Amazon Music のURLカラムを追加（存在しない場合のみ）
alter table public.songs add column if not exists youtube_url text;
alter table public.songs add column if not exists apple_music_url text;
alter table public.songs add column if not exists amazon_music_url text;
