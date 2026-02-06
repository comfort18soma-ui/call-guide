-- Create requests table for user requests
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('artist', 'song', 'mix', 'inquiry')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'replied')),
  created_at timestamptz not null default now(),
  
  -- Artist request fields
  artist_name text,
  artist_x_url text,
  artist_image_path text,
  
  -- Song request fields
  song_title text,
  related_artist_id uuid references public.artists(id) on delete set null,
  youtube_url text,
  apple_music_url text,
  
  -- Mix request fields
  mix_title text,
  mix_content text,
  mix_bars text,
  reference_url text,
  
  -- Inquiry fields
  inquiry_content text,
  admin_reply text
);

-- Create indexes for faster queries
create index if not exists requests_user_id_idx on public.requests (user_id);
create index if not exists requests_type_idx on public.requests (type);
create index if not exists requests_status_idx on public.requests (status);
create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_related_artist_id_idx on public.requests (related_artist_id);

-- Add comments
comment on table public.requests is 'ユーザーからのリクエスト（アーティスト追加、楽曲追加、MIX追加、問い合わせ）を保存するテーブル';
comment on column public.requests.type is 'リクエスト種別: artist, song, mix, inquiry';
comment on column public.requests.status is '処理状況: pending, approved, rejected, replied';

-- Create storage bucket for request images (if not exists)
insert into storage.buckets (id, name, public)
values ('request-images', 'request-images', false)
on conflict (id) do nothing;

-- Set up storage policy (allow authenticated users to upload)
create policy "Users can upload request images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'request-images');

-- Allow public read access to request images
create policy "Public can read request images"
on storage.objects for select
to public
using (bucket_id = 'request-images');
