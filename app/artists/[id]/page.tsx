"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Music, Youtube, Loader2, User, ExternalLink, ChevronRight, Share } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Song = {
  id: number;
  title: string;
  youtube_url: string | null;
  apple_music_url: string | null;
  amazon_music_url: string | null;
};

type ArtistWithSongs = {
  id: string;
  name: string;
  reading: string | null;
  x_url: string | null;
  twitter_url?: string | null;
  songs: Song[];
};

export default function ArtistDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [artist, setArtist] = useState<ArtistWithSongs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchArtist = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: artistData, error: artistError } = await supabase
          .from("artists")
          .select("id, name, reading, x_url")
          .eq("id", id)
          .single();

        if (artistError) throw artistError;
        const row = artistData as Record<string, unknown> | null;
        if (!row) {
          setArtist(null);
          return;
        }

        const { data: songsData } = await supabase
          .from("songs")
          .select("id, title, youtube_url, apple_music_url, amazon_music_url")
          .eq("artist_id", id)
          .order("title", { ascending: true });

        const songs = (songsData as Song[] | null) ?? [];

        setArtist({
          id: row.id as string,
          name: row.name as string,
          reading: (row.reading as string | null) ?? null,
          x_url: (row.x_url as string | null) ?? null,
          songs,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "アーティストの取得に失敗しました";
        setError(message);
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchArtist();
  }, [id]);

  if (!id) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <p className="text-sm text-zinc-500">アーティストIDが指定されていません。</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </main>
    );
  }

  if (error || !artist) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error ?? "アーティストが見つかりません。"}
          </div>
          <Link href="/calls" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
            ← アーティスト一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  const xUrl = artist.x_url ?? null;

  const handleShare = async () => {
    const title = `${artist.name}のコール表一覧 | Call Guide`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share && url) {
        await navigator.share({
          title,
          url,
        });
        return;
      }
    } catch {
      // ユーザーキャンセルなどは無視
    }
    const tweetText = encodeURIComponent(`${title} ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* ヘッダー: 名前・読み方・Xリンク（テキスト中心） */}
        <header className="mb-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                <User className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                    {artist.name}
                  </h1>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="shrink-0 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 active:scale-95"
                    aria-label="共有"
                  >
                    <Share className="h-4 w-4" />
                  </button>
                </div>
                {artist.reading && (
                  <p className="mt-0.5 text-sm text-zinc-500">（{artist.reading}）</p>
                )}
              </div>
            </div>
            {xUrl && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                asChild
              >
                <a href={xUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  X (Twitter)
                </a>
              </Button>
            )}
          </div>
        </header>

        {/* 楽曲一覧 */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">楽曲一覧</h2>
          {artist.songs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6 text-center text-sm text-zinc-500">
              このアーティストの楽曲はまだ登録されていません。
            </div>
          ) : (
            <ul className="space-y-1.5">
              {artist.songs.map((song) => (
                <li key={song.id}>
                  <Link
                    href={`/songs/${song.id}`}
                    className="flex h-14 flex-row items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-800/80 active:scale-[0.99]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Music className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="min-w-0 truncate font-medium text-zinc-100">
                        {song.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {song.youtube_url && (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-red-400 text-[10px]"
                          aria-hidden
                        >
                          YT
                        </span>
                      )}
                      {song.apple_music_url && (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-emerald-400 text-[10px]"
                          aria-hidden
                        >
                          AM
                        </span>
                      )}
                      {song.amazon_music_url && (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-cyan-400 text-[10px]"
                          aria-hidden
                        >
                          Az
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/calls"
          className="mt-8 inline-block text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← アーティスト一覧に戻る
        </Link>
      </div>
    </main>
  );
}
