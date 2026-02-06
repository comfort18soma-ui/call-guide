"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Clock, TrendingUp, Music, Youtube, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SongWithArtist = {
  id: number;
  title: string;
  youtube_url: string | null;
  apple_music_url: string | null;
  amazon_music_url: string | null;
  artist_name: string;
  artist_reading: string | null;
};

const recentSearches = ["◯◯◯◯", "◯◯のテーマ", "◯◯◯◯◯"];
const popularWords = ["サビ", "イントロ", "Aメロ", "MIX", "コール"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<SongWithArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("songs")
          .select("id, title, youtube_url, apple_music_url, amazon_music_url, artist_id, artists ( name, reading )")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        const mapped: SongWithArtist[] = (data ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          youtube_url: row.youtube_url,
          apple_music_url: row.apple_music_url,
          amazon_music_url: row.amazon_music_url,
          artist_name: row.artists?.name ?? "不明",
          artist_reading: row.artists?.reading ?? null,
        }));

        setSongs(mapped);
      } catch (err: any) {
        setError(err?.message ?? "楽曲データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void fetchSongs();
  }, []);

  const filteredSongs = useMemo(() => {
    if (!query.trim()) return songs;
    const q = query.toLowerCase();
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) ||
        song.artist_name.toLowerCase().includes(q) ||
        (song.artist_reading?.toLowerCase().includes(q) ?? false)
    );
  }, [songs, query]);

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* ヘッダー */}
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">検索</h1>
        </header>

        {/* 検索バー */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="楽曲・アーティストを検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 rounded-xl border-zinc-800 bg-zinc-900 pl-12 pr-4 text-base"
              autoFocus
            />
          </div>
        </div>

        {!query && (
          <div className="space-y-6">
            {/* 最近の検索 */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-medium text-zinc-300">最近の検索</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-850 active:scale-95"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* 人気ワード */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-medium text-zinc-300">人気ワード</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularWords.map((word, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuery(word)}
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-850 active:scale-95"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 検索結果 */}
        {query && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/60 bg-red-500/10 p-4 text-xs text-red-200">
                {error}
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-center text-xs text-zinc-500">
                「{query}」に一致する楽曲が見つかりませんでした。
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc-500">
                  {filteredSongs.length} 件見つかりました
                </p>
                {filteredSongs.map((song) => (
                  <Link key={song.id} href={`/songs/${song.id}`}>
                    <Card className="rounded-xl border-zinc-800 bg-zinc-950/80 transition-all hover:border-zinc-700 active:scale-[0.98]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4 text-zinc-500" />
                              <h3 className="text-sm font-semibold text-zinc-100">
                                {song.title}
                              </h3>
                            </div>
                            <p className="text-xs text-zinc-400">{song.artist_name}</p>
                            <div className="flex items-center gap-2 pt-1">
                              {song.youtube_url && (
                                <a
                                  href={song.youtube_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-red-400 transition-colors hover:border-zinc-700"
                                >
                                  <Youtube className="h-3 w-3" />
                                  YouTube
                                </a>
                              )}
                              {song.apple_music_url && (
                                <a
                                  href={song.apple_music_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-emerald-400 transition-colors hover:border-zinc-700"
                                >
                                  <Music className="h-3 w-3" />
                                  Apple Music
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
