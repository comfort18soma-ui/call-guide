-- Mix辞典用テーブル
create table if not exists public.mixes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  bars text not null,
  created_at timestamptz not null default now()
);

create index if not exists mixes_title_idx on public.mixes (lower(title));
create index if not exists mixes_bars_idx on public.mixes (bars);
create index if not exists mixes_created_at_idx on public.mixes (created_at desc);

comment on table public.mixes is 'Mix辞典のデータ（タイトル・本文・小節分類）';

-- 初期データ投入
insert into public.mixes (title, content, bars) values
  (
    'スタンダードMix',
    'タイガー！ファイヤー！サイバー！ファイバー！ダイバー！バイバー！ジャージャー！',
    '基本の8小節'
  ),
  (
    'ジャパニーズMix',
    '虎！火！人造！繊維！海女！振動！化繊！',
    '基本の8小節'
  ),
  (
    'ドイツMix',
    'ツァイガー！ファイアー！ザイバー！ファイバー！タイファー！バイファー！ヤーヤー！',
    '基本の8小節'
  ),
  (
    'スパニッシュMix',
    'ティグレ！フエゴ！シバ！フィブラ！ティブロ！ビブロ！ジャジャ！',
    '可変3連'
  ),
  (
    'アイヌ語Mix',
    'チャペ！アペ！カラ！キナ！ララ！トゥスケ！ミョーホントゥスケ！',
    '特殊枠'
  ),
  (
    'ミドル8小節',
    'サンキュー！サンキュー！サンキュー！サンキュー！',
    '可変3連'
  )
;
