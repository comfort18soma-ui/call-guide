"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Music,
  Loader2,
  Youtube,
  ExternalLink,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { CopyButton } from "@/components/ui/copy-button";
import { ActionButtons } from "@/components/action-buttons";
import { ReportDialog } from "@/components/report-dialog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type MixDetail = {
  id: string;
  title: string;
  content: string;
  bars?: number | null;
  url?: string | null;
  reference_url?: string | null;
  song_id?: number | string | null;
  created_at?: string;
  author_id?: string | null;
  author_name?: string | null;
  profiles?: { username: string | null } | null;
};

type SongInfo = {
  id: number; // song_id
  title: string;
  artist_name?: string;
  chart_id: string;
};

function parseYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v") ?? (u.pathname.includes("/embed/") ? u.pathname.split("/embed/")[1]?.split("/")[0] : null);
    if (v) return `https://www.youtube.com/embed/${v}`;
    const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  } catch {
    return null;
  }
  return null;
}

export default function MixDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [mix, setMix] = useState<MixDetail | null>(null);
  const [linkedSongs, setLinkedSongs] = useState<SongInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchMixAndLinkedSongs = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. MIX 本体
        const { data: mixData, error: mixError } = await supabase
          .from("mixes")
          .select(`
            *,
            profiles!mixes_author_id_fkey (
              username,
              handle
            )
          `)
          .eq("id", id)
          .single();

        if (mixError) throw mixError;
        const currentMix = mixData as MixDetail | null;
        if (!currentMix) {
          setMix(null);
          setLinkedSongs([]);
          return;
        }

        setMix(currentMix);

        // 2. call_sections 経由で、この MIX が使われている楽曲を取得
        const { data: sectionData, error: sectionError } = await supabase
          .from("call_sections")
          .select(`
            id,
            call_chart_id,
            call_charts (
              id,
              status,
              song_id,
              songs (
                id,
                title,
                artists ( name )
              )
            )
          `)
          .eq("mix_id", currentMix.id)
          .eq("call_charts.status", "approved");

        if (sectionError) {
          console.error("Error fetching linked songs for mix:", sectionError);
          setLinkedSongs([]);
        } else {
          const seen = new Set<string>();
          const songsList: SongInfo[] = [];
          const rows = (sectionData ?? []) as unknown as Array<{
            call_charts?: {
              id: string;
              status: string;
              song_id: number;
              songs?: {
                id: number;
                title: string;
                artists?: { name?: string } | null;
              } | null;
            } | null;
          }>;

          for (const row of rows) {
            const chart = row.call_charts;
            if (!chart || chart.status !== "approved") continue;
            const s =
              chart.songs as
                | { id: number; title: string; artists?: { name?: string } | null }
                | null
                | undefined;
            if (!s) continue;
            if (seen.has(chart.id)) continue;
            seen.add(chart.id);
            songsList.push({
              id: s.id,
              title: s.title,
              artist_name: s.artists?.name,
              chart_id: chart.id,
            });
          }

          setLinkedSongs(songsList);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "MIXの取得に失敗しました";
        setError(message);
        setMix(null);
        setLinkedSongs([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchMixAndLinkedSongs();
  }, [id]);

  if (!id) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <p className="text-sm text-zinc-500">MIX IDが指定されていません。</p>
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

  if (error || !mix) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error ?? "MIXが見つかりません。"}
          </div>
          <Link href="/mixes" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
            ← MIX辞典に戻る
          </Link>
        </div>
      </main>
    );
  }

  const referenceUrl = (mix.reference_url ?? mix.url ?? "").trim() || null;
  const embedUrl = referenceUrl ? parseYoutubeEmbedUrl(referenceUrl) : null;
  const barsDisplay = mix.bars != null ? `${mix.bars}小節` : "—";
  const profile = Array.isArray(mix.profiles) ? mix.profiles[0] : mix.profiles;
  const authorName = profile?.username ?? mix.author_name ?? linkedSongs[0]?.artist_name ?? null;
  const uniqueLinkedSongs = Array.from(
    new Map(linkedSongs.map((song) => [song.chart_id, song])).values()
  );
  const visibleLinkedSongs = uniqueLinkedSongs.slice(0, 5);

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-4">
          <Link
            href="/mixes"
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
            <span>一覧に戻る</span>
          </Link>
        </div>

        {/* タイトル・作成者・小節数 */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {mix.title}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-zinc-400">
            <User className="h-4 w-4 shrink-0" />
            <span className="text-sm">
              作成者:{" "}
              {(profile?.handle || mix.author_id) ? (
                <Link href={`/users/${profile?.handle || mix.author_id}`} className="hover:underline hover:text-zinc-200">
                  {authorName || "名無し"}
                </Link>
              ) : (
                authorName || "名無し"
              )}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">小節数: {barsDisplay}</p>
          <div className="mt-3">
            <ActionButtons mixId={mix.id} authorName={authorName} />
          </div>
        </header>

        {/* コール内容 */}
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-400">コール内容</h2>
            {(mix.content ?? "").trim() && (
              <CopyButton text={mix.content || ""} size="sm" className="h-8 rounded-lg border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" />
            )}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {mix.content || "（内容なし）"}
            </p>
          </div>
        </section>

        {/* 参考動画 */}
        {referenceUrl && (
          <section className="mb-8">
            <h3 className="mb-2 text-lg font-bold text-zinc-100">参考動画</h3>
            {embedUrl ? (
              <>
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  <iframe
                    title="参考動画"
                    src={embedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <a
                  href={referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100"
                >
                  <Youtube className="h-4 w-4" />
                  YouTubeで見る
                </a>
              </>
            ) : (
              <a
                href={referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:underline"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                {referenceUrl}
              </a>
            )}
          </section>
        )}

        {/* このMIXが使われている楽曲 / Used in */}
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            このMIXが使われている楽曲
          </h2>
          {uniqueLinkedSongs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-center text-xs text-zinc-500">
              まだ登録されている楽曲はありません。
            </div>
          ) : (
            <>
              <ul className="space-y-1.5">
                {visibleLinkedSongs.map((song) => (
                  <li key={song.chart_id}>
                    <Link
                      href={`/songs/${song.id}/${song.chart_id}`}
                      className="flex h-14 flex-row items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-800/80 active:scale-[0.99]"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Music className="h-4 w-4 shrink-0 text-zinc-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-100">
                            {song.title}
                          </p>
                          {song.artist_name && (
                            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                              {song.artist_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                    </Link>
                  </li>
                ))}
              </ul>
              {uniqueLinkedSongs.length > visibleLinkedSongs.length && (
                <p className="mt-1 text-right text-xs text-zinc-500">
                  …他 {uniqueLinkedSongs.length - visibleLinkedSongs.length} 件
                </p>
              )}
            </>
          )}
        </section>

        <div className="mt-6 flex justify-center">
          <ReportDialog targetId={mix.id} targetType="mix" />
        </div>

        <Link
          href="/mixes"
          className="mt-8 inline-block text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← MIX辞典に戻る
        </Link>
      </div>
    </main>
  );
}
