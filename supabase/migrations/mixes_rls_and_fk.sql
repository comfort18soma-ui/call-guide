-- 1. ログインしていない人(anon)もMIXを見れるようにする
drop policy if exists "Enable read access for all users" on mixes;
create policy "Enable read access for all users" on mixes for select to anon using (true);

-- 2. ログインしている人(authenticated)もMIXを見れるようにする
-- （※これがないと、ログインした瞬間に見えなくなることがあります）
drop policy if exists "Enable read access for authenticated users" on mixes;
create policy "Enable read access for authenticated users" on mixes for select to authenticated using (true);

-- 3. MIXテーブルとSongsテーブルの紐付けを修復する
-- （もし外部キー制約が壊れていると、曲ごとのMIX取得に失敗するため）
alter table mixes drop constraint if exists mixes_song_id_fkey;
alter table mixes add constraint mixes_song_id_fkey foreign key (song_id) references songs(id) on delete cascade;

-- 4. 設定をリロード
NOTIFY pgrst, 'reload config';
