"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Loader2, User, ChevronRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Artist = {
  id: string;
  name: string;
  reading: string | null;
  x_url: string | null;
};

export default function CallsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchArtists = async () => {
      setLoadingArtists(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("artists")
          .select("id, name, reading, x_url")
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;
        setArtists((data as Artist[]) ?? []);
      } catch (err) {
        console.error("Supabase Error Details:", err);
        if (err && typeof err === "object") {
          const e = err as { message?: string; details?: string; hint?: string };
          if (e.message) console.error("Error Message:", e.message);
          if (e.details) console.error("Error Details:", e.details);
          if (e.hint) console.error("Error Hint:", e.hint);
        }
        const message = err instanceof Error ? err.message : "アーティストの取得に失敗しました";
        setError(message);
        setArtists([]);
      } finally {
        setLoadingArtists(false);
      }
    };
    void fetchArtists();
  }, []);

  const filteredArtists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.reading?.toLowerCase().includes(q) ?? false)
    );
  }, [artists, searchQuery]);

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">コール表</h1>
          <p className="mt-1 text-sm text-zinc-400">
            アーティストを選んで楽曲一覧を表示
          </p>
        </header>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="アーティスト名・読み方で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-lg border-zinc-800 bg-zinc-900/50 pl-11 pr-3 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loadingArtists ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6 text-center text-sm text-zinc-500">
            {searchQuery.trim()
              ? "該当するアーティストがいません。"
              : "登録されているアーティストがいません。"}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {filteredArtists.map((artist) => (
              <li key={artist.id}>
                <Link
                  href={`/artists/${artist.id}`}
                  className="flex h-14 flex-row items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-800/80 active:scale-[0.99]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-base font-medium text-zinc-100">
                        {artist.name}
                      </span>
                      {artist.reading && (
                        <span className="ml-1.5 text-xs text-zinc-500">
                          （{artist.reading}）
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
