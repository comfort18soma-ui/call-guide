-- アーティストリクエストに読み方（カタカナ）を追加
alter table public.requests add column if not exists artist_reading text;
