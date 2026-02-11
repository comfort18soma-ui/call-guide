"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  User,
  ArrowLeft,
  Heart,
  Share,
  Trash2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { ReportDialog } from "@/components/report-dialog";
import AddToSetlistButton from "@/components/AddToSetlistButton";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getYoutubeEmbedUrl(url: string | null): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url);
    const v =
      u.searchParams.get("v") ??
      (u.pathname.includes("/embed/") ? u.pathname.split("/embed/")[1]?.split("/")[0] : null);
    if (v) return `https://www.youtube.com/embed/${v}`;
    const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  } catch {
    return null;
  }
  return null;
}

type SongInfo = {
  id: number;
  title: string;
  artist_id: string | null;
  artist_name: string;
  youtube_url: string | null;
  apple_music_url: string | null;
   amazon_music_url: string | null;
};

type SectionRow = {
  id: string;
  section_name: string;
  content: string;
  order_index: number;
  mix_id?: string | number | null;
  mix_title?: string | null;
};

type ChartDetail = {
  id: string;
  title: string | null;
  created_at: string;
  like_count?: number;
  author_id: string | null;
  profiles: { username: string | null; handle: string | null } | null;
  sections: SectionRow[];
};

export default function CallChartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const chartId = params?.chartId as string | undefined;

  const [song, setSong] = useState<SongInfo | null>(null);
  const [chart, setChart] = useState<ChartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const { role } = useUserRole();

  useEffect(() => {
    if (!id || !chartId) {
      setLoading(false);
      setError("URL が不正です");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("call_charts")
          .select(`
            id,
            song_id,
            author_id,
            title,
            created_at,
            like_count,
            profiles!call_charts_author_id_fkey (
              username,
              handle
            ),
            songs (
              id,
              title,
              youtube_url,
              apple_music_url,
              amazon_music_url,
              artist_id,
              artists ( id, name )
            ),
            call_sections (
              id,
              section_name,
              content,
              order_index,
              mix_id
            )
          `)
          .eq("id", chartId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) {
          setError("コール表が見つかりません。");
          setSong(null);
          setChart(null);
          return;
        }

        const row = data as unknown as {
          id: string;
          song_id: number;
          author_id: string | null;
          title: string | null;
          created_at: string;
          like_count?: number | null;
          profiles?: { username: string | null; handle: string | null } | null;
          songs?: {
            id: number;
            title: string;
            youtube_url: string | null;
            apple_music_url: string | null;
            amazon_music_url: string | null;
            artist_id: string | null;
            artists?: { name?: string } | null;
          } | null;
          call_sections?: SectionRow[];
        };

        const songRow = row.songs;
        if (!songRow) {
          setError("楽曲情報が取得できませんでした。");
          setSong(null);
          setChart(null);
          return;
        }

        setSong({
          id: songRow.id,
          title: songRow.title,
          artist_id: songRow.artist_id,
          artist_name: songRow.artists?.name ?? "不明",
          youtube_url: songRow.youtube_url,
          apple_music_url: songRow.apple_music_url,
          amazon_music_url: songRow.amazon_music_url,
        });

        const sectionsRaw = (row.call_sections ?? []) as (SectionRow & {
          mix_id?: string | number | null;
        })[];

        // mix_id 付きセクションの MIX タイトルを取得
        const mixIdSet = new Set<string>();
        for (const sec of sectionsRaw) {
          if (sec.mix_id != null) {
            mixIdSet.add(String(sec.mix_id));
          }
        }

        let mixTitleMap: Record<string, string> = {};
        if (mixIdSet.size > 0) {
          const { data: mixData } = await supabase
            .from("mixes")
            .select("id, title")
            .in("id", Array.from(mixIdSet));
          for (const m of (mixData ?? []) as { id: string | number; title: string | null }[]) {
            mixTitleMap[String(m.id)] = m.title ?? "";
          }
        }

        const sections: SectionRow[] = sectionsRaw
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((sec) => ({
            ...sec,
            mix_title: sec.mix_id != null ? mixTitleMap[String(sec.mix_id)] ?? null : null,
          }));

        setChart({
          id: row.id,
          title: row.title,
          created_at: row.created_at,
          like_count: row.like_count ?? 0,
          author_id: row.author_id,
          profiles: row.profiles ?? null,
          sections,
        });
        setLikeCount(row.like_count ?? 0);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "コール表の取得に失敗しました";
        setError(message);
        setSong(null);
        setChart(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id, chartId]);

  // ログインユーザーとお気に入り状態の取得
  useEffect(() => {
    const loadBookmark = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid || !chartId) {
        setIsBookmarked(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", uid)
          .eq("call_chart_id", chartId)
          .limit(1);
        setIsBookmarked((data?.length ?? 0) > 0);
      } catch {
        setIsBookmarked(false);
      }
    };
    void loadBookmark();
  }, [chartId]);

  const handleToggleBookmark = async () => {
    if (!chart) return;
    if (!userId) {
      alert("ログインが必要です");
      return;
    }
    const current = isBookmarked;
    const chartIdStr = chart.id;

    // 楽観的更新
    setIsBookmarked(!current);
    setLikeCount((prev) => Math.max(0, prev + (current ? -1 : 1)));

    try {
      if (current) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("call_chart_id", chartIdStr);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert({
          user_id: userId,
          call_chart_id: chartIdStr,
          mix_id: null,
          category: "practice",
        });
        const code = (error as { code?: string } | null)?.code;
        if (error && code !== "23505") throw error;
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") {
        return;
      }
      // ロールバック
      setIsBookmarked(current);
      setLikeCount((prev) => Math.max(0, prev + (current ? 1 : -1)));
      alert("更新に失敗しました");
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const songTitle = song?.title ?? "コール表";
    const artistName = song?.artist_name ?? "";
    const title = artistName
      ? `${songTitle} / ${artistName} のコール表 | Call Guide`
      : `${songTitle} | Call Guide`;

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

  const handleDelete = async () => {
    if (!chart) return;
    if (!role || role !== "admin") return;
    if (!window.confirm("本当にこのコール表を削除しますか？")) return;

    try {
      const { error } = await supabase
        .from("call_charts")
        .delete()
        .eq("id", chart.id);
      if (error) throw error;

      try {
        sessionStorage.setItem("TOAST_CALL_DELETED", "1");
      } catch {
        // ignore
      }
      router.push(`/songs/${id}`);
    } catch (err) {
      console.error("Delete error:", err);
      alert("削除に失敗しました");
    }
  };

  if (!id || !chartId) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <p className="text-sm text-zinc-500">URL が不正です。</p>
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

  if (error || !song || !chart) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error ?? "コール表が見つかりません。"}
          </div>
          <Link
            href={`/songs/${id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            コール一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  const artistHref = song.artist_id ? `/artists/${song.artist_id}` : "/calls";
  const authorDisplay =
    chart.profiles?.username ?? chart.profiles?.handle ?? chart.author_id ?? "名無し";
  const youtubeEmbedUrl = getYoutubeEmbedUrl(song.youtube_url);

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* 戻るリンク */}
        <button
          type="button"
          onClick={() => router.push(`/songs/${id}`)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          コール一覧に戻る
        </button>

        {/* 楽曲情報ヘッダー */}
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                {song.title}
              </h1>
              <Link
                href={artistHref}
                className="mt-1 inline-block text-sm text-zinc-400 hover:underline hover:text-zinc-200"
              >
                {song.artist_name}
              </Link>
              {youtubeEmbedUrl && (
                <div className="my-4 w-full max-w-full overflow-hidden rounded-lg">
                  <div className="aspect-video w-full">
                    <iframe
                      src={youtubeEmbedUrl}
                      title="YouTube動画"
                      className="h-full w-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {song.apple_music_url && (
                  <a
                    href={song.apple_music_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[42px] items-center"
                    aria-label="Listen on Apple Music"
                  >
                    <img
                      src="https://tools.applemediaservices.com/api/badges/listen-on-apple-music/badge/ja-jp?size=250x83&releaseDate=1553817600&h=e59146ec7b6320a91e574d797f1f727c"
                      alt="Listen on Apple Music"
                      className="h-[42px] w-auto"
                    />
                  </a>
                )}
                {song.amazon_music_url && (
                  <a
                    href={song.amazon_music_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-[42px] items-center justify-center gap-2 rounded-[8px] bg-[#232F3E] px-4 text-white transition-opacity hover:opacity-80"
                    aria-label="Amazon Musicで聴く"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <span className="text-sm font-bold">Amazon Music</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* コール表ヘッダー */}
        <section className="mb-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-semibold text-zinc-100">
              {chart.title || "（タイトルなし）"}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0" />
                {(chart.profiles?.handle || chart.author_id) ? (
                  <Link
                    href={`/users/${chart.profiles?.handle || chart.author_id}`}
                    className="max-w-[100px] truncate hover:underline hover:text-zinc-200"
                  >
                    {authorDisplay}
                  </Link>
                ) : (
                  <span className="max-w-[100px] truncate">{authorDisplay}</span>
                )}
              </span>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            作成日: {new Date(chart.created_at).toLocaleDateString("ja-JP")}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-zinc-700 px-2.5 text-[11px] text-zinc-200"
                onClick={handleToggleBookmark}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${
                    isBookmarked ? "text-rose-500 fill-rose-500" : "text-zinc-400"
                  }`}
                />
                <span className="ml-1 tabular-nums">{likeCount}</span>
              </Button>
              <AddToSetlistButton songId={song.id} callId={Number(chart.id)} />
              <button
                type="button"
                onClick={handleShare}
                className="flex h-8 shrink-0 items-center justify-center rounded-full p-2 text-zinc-400 transition-all hover:bg-white/10 hover:text-zinc-300 active:scale-95"
                aria-label="共有"
              >
                <Share className="h-3.5 w-3.5" />
              </button>
              {role === "admin" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-2.5 text-[11px] text-red-300 hover:bg-red-500/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="ml-1">削除</span>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* セクションごとのコール内容 */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            コール内容
          </h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60">
            <ul className="divide-y divide-zinc-800">
              {chart.sections.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-zinc-500">
                  セクションが登録されていません。
                </li>
              ) : (
                chart.sections.map((sec) => (
                  <li
                    key={sec.id}
                    className="grid grid-cols-[minmax(0,120px)_1fr] gap-3 px-3 py-3 first:pt-3 sm:grid-cols-[140px_1fr]"
                  >
                    <div className="shrink-0 rounded-lg bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200">
                      <div>{sec.section_name || "—"}</div>
                      {sec.mix_id && sec.mix_title && (
                        <Link
                          href={`/mixes/${sec.mix_id}`}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-normal text-emerald-300 hover:text-emerald-200 hover:underline"
                        >
                          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                            MIX
                          </span>
                          <span className="max-w-[120px] truncate">
                            {sec.mix_title}
                          </span>
                        </Link>
                      )}
                    </div>
                    <p className="min-w-0 whitespace-pre-wrap text-sm text-zinc-300">
                      {sec.content || "（内容なし）"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <div className="mt-6 flex justify-center">
          <ReportDialog targetId={chart.id} targetType="call_chart" />
        </div>

        <Link
          href={`/songs/${id}`}
          className="mt-8 inline-block text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← コール一覧に戻る
        </Link>
      </div>
    </main>
  );
}

