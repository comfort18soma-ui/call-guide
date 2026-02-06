-- 1. Songs（曲）テーブルに作成日時を追加
alter table songs add column if not exists created_at timestamptz default now();

-- 2. Artists（アーティスト）テーブルにも念のため追加
alter table artists add column if not exists created_at timestamptz default now();

-- 3. Mixes（MIX）テーブルにも念のため追加
alter table mixes add column if not exists created_at timestamptz default now();

-- 4. 設定をリロード
NOTIFY pgrst, 'reload config';
