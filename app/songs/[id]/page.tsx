"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Plus, User, Heart, Youtube, Pencil } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { EditSongModal } from "@/components/EditSongModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SongWithArtist = {
  id: number;
  title: string;
  artist_id: string | null;
  artist_name: string;
  youtube_url: string | null;
  apple_music_url: string | null;
  amazon_music_url: string | null;
};

type CallSectionRow = {
  id: string;
  section_name: string;
  content: string;
  order_index: number;
  mix_id?: string | number | null;
  mix_title?: string | null;
};

type CallChartRow = {
  id: string;
  song_id: number;
  author_id: string | null;
  title: string | null;
  status: string;
  created_at: string;
  like_count?: number;
  profiles: { username: string | null; handle: string | null } | null;
  call_sections: CallSectionRow[];
};

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [song, setSong] = useState<SongWithArtist | null>(null);
  const [callCharts, setCallCharts] = useState<CallChartRow[]>([]);
  const [loadingSong, setLoadingSong] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarkedChartIds, setBookmarkedChartIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"popular" | "newest">("popular");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { role } = useUserRole();

  const fetchSong = useCallback(async () => {
    if (!id) return;
      setLoadingSong(true);
      setError(null);
      try {
        const songId = Number(id);
        const { data, error: fetchError } = await supabase
          .from("songs")
          .select("id, title, youtube_url, apple_music_url, amazon_music_url, artist_id, artists(id, name)")
          .eq("id", isNaN(songId) ? id : songId)
          .single();

        if (fetchError) throw fetchError;
        const row = data as Record<string, unknown> | null;
        if (!row) {
          setSong(null);
          return;
        }
        setSong({
          id: row.id as number,
          title: row.title as string,
          artist_id: (row.artist_id as string | null) ?? null,
          artist_name: (row.artists as { name?: string } | null)?.name ?? "不明",
          youtube_url: (row.youtube_url as string | null) ?? null,
          apple_music_url: (row.apple_music_url as string | null) ?? null,
          amazon_music_url: (row.amazon_music_url as string | null) ?? null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "楽曲の取得に失敗しました";
        setError(message);
        setSong(null);
      } finally {
        setLoadingSong(false);
      }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoadingSong(false);
      return;
    }
    void fetchSong();
  }, [id, fetchSong]);

  useEffect(() => {
    if (!id) {
      setLoadingCharts(false);
      return;
    }
    const songId = Number(id);
    const songIdFilter = Number.isNaN(songId) ? id : songId;

    const fetchCallCharts = async () => {
      setLoadingCharts(true);
      try {
        let query = supabase
          .from("call_charts")
          .select(`
            id,
            song_id,
            author_id,
            title,
            status,
            created_at,
            like_count,
            profiles!call_charts_author_id_fkey (
              username,
              handle
            ),
            call_sections (
              id,
              section_name,
              content,
              order_index,
              mix_id
            )
          `)
          .eq("song_id", songIdFilter)
          .eq("status", "approved");

        if (sortOrder === "popular") {
          query = query.order("like_count", { ascending: false });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        const rows = (data ?? []) as unknown as CallChartRow[];

        // mix_id を持つセクションの MIX タイトルをまとめて取得
        const mixIdSet = new Set<string>();
        for (const row of rows) {
          for (const sec of (row.call_sections ?? []) as (CallSectionRow & { mix_id?: string | number | null })[]) {
            if (sec.mix_id != null) {
              mixIdSet.add(String(sec.mix_id));
            }
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

        setCallCharts(
          rows.map((r) => ({
            ...r,
            like_count: r.like_count ?? 0,
            call_sections: (r.call_sections ?? [])
              .sort((a, b) => a.order_index - b.order_index)
              .map((sec) => ({
                ...sec,
                mix_title:
                  sec.mix_id != null ? mixTitleMap[String(sec.mix_id)] ?? null : null,
              })),
          }))
        );
      } catch {
        setCallCharts([]);
      } finally {
        setLoadingCharts(false);
      }
    };
    void fetchCallCharts();
  }, [id, sortOrder]);

  useEffect(() => {
    const loadBookmarks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setBookmarkedChartIds(new Set());
        return;
      }
      try {
        const { data } = await supabase
          .from("bookmarks")
          .select("call_chart_id")
          .eq("user_id", uid)
          .not("call_chart_id", "is", null);
        const ids = new Set<string>(
          (data ?? []).map((r: { call_chart_id: string | number | null }) =>
            r.call_chart_id != null ? String(r.call_chart_id) : ""
          ).filter(Boolean)
        );
        setBookmarkedChartIds(ids);
      } catch {
        setBookmarkedChartIds(new Set());
      }
    };
    void loadBookmarks();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("TOAST_CALL_CREATED")) {
        setToastMessage("コール表を投稿しました");
        sessionStorage.removeItem("TOAST_CALL_CREATED");
      } else if (sessionStorage.getItem("TOAST_CALL_DELETED")) {
        setToastMessage("コール表を削除しました");
        sessionStorage.removeItem("TOAST_CALL_DELETED");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleBookmark = async (chartId: string) => {
    if (!userId) {
      alert("ログインが必要です");
      return;
    }
    const isBookmarked = bookmarkedChartIds.has(chartId);

    // 1. 楽観的UI更新 (APIを待たずに見た目を先に切り替え)
    setBookmarkedChartIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(chartId);
      else next.add(chartId);
      return next;
    });
    // いいね数も即時 +1 / -1
    setCallCharts((prev) =>
      prev.map((c) =>
        c.id === chartId
          ? { ...c, like_count: Math.max(0, (c.like_count ?? 0) + (isBookmarked ? -1 : 1)) }
          : c
      )
    );

    try {
      if (isBookmarked) {
        // 2a. OFF: 解除 (DELETE)
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("call_chart_id", chartId);
        if (error) throw error;
      } else {
        // 2b. ON: 保存 (INSERT)
        const { error } = await supabase.from("bookmarks").insert({
          user_id: userId,
          call_chart_id: chartId,
          mix_id: null,
          category: "practice",
        });
        // 23505 (unique constraint violation) は「すでに保存済み」なので無視
        if (error && error.code !== "23505") throw error;
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      console.error("Toggle error:", JSON.stringify(err, null, 2));
      // 23505 は結果オーライなのでロールバック・アラートしない
      if (code === "23505") return;
      // 3. それ以外のエラー時のみロールバック（いいね状態と表示数）
      setBookmarkedChartIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(chartId);
        else next.delete(chartId);
        return next;
      });
      setCallCharts((prev) =>
        prev.map((c) =>
          c.id === chartId
            ? { ...c, like_count: Math.max(0, (c.like_count ?? 0) + (isBookmarked ? 1 : -1)) }
            : c
        )
      );
      alert("更新に失敗しました");
    }
  };

  if (!id) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <p className="text-sm text-zinc-500">楽曲IDが指定されていません。</p>
        </div>
      </main>
    );
  }

  if (loadingSong) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </main>
    );
  }

  if (error || !song) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error ?? "楽曲が見つかりません。"}
          </div>
          <Link href="/calls" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
            ← 一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  const artistHref = song.artist_id ? `/artists/${song.artist_id}` : "/calls";

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {toastMessage && (
          <div className="mb-3 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-center text-xs font-medium text-emerald-200">
            {toastMessage}
          </div>
        )}
        {/* ヘッダー: 曲名・アーティスト・リンク・コール作成ボタン */}
        <header className="mb-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                {song.title}
              </h1>
              {role === "admin" && (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="shrink-0 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200 active:scale-95"
                  aria-label="楽曲を編集"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            <Link
              href={artistHref}
              className="mt-1 inline-block text-sm text-zinc-400 hover:underline hover:text-zinc-200"
            >
              {song.artist_name}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {song.youtube_url && (
                <a
                  href={song.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[42px] items-center gap-2 rounded-md bg-[#FF0000] px-3 py-2 transition-opacity hover:opacity-90"
                  aria-label="YouTubeで聴く"
                >
                  <Youtube className="h-6 w-6 text-white" />
                  <span className="text-sm font-medium text-white">YouTube</span>
                </a>
              )}
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border-zinc-700 px-2.5 text-[11px] text-zinc-200 hover:bg-zinc-900"
                onClick={() => {
                  if (!userId) {
                    router.push("/login");
                    return;
                  }
                  router.push(`/songs/${id}/add`);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>コールを作成</span>
              </Button>
            </div>
          </div>
        </header>

        {/* 承認されたコール表 (Call Charts) */}
        <section className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            コール表 (Call Charts)
          </h2>

          {loadingCharts ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : callCharts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 p-5 text-center">
              <p className="mb-3 text-xs font-medium text-zinc-400">
                まだコール表が登録されていません
              </p>
              <p className="mb-4 text-[11px] text-zinc-500">
                この曲のコール表を最初に作成しませんか？
              </p>
              <Button
                size="sm"
                className="h-9 rounded-lg px-3 text-sm"
                onClick={() => {
                  if (!userId) {
                    router.push("/login");
                    return;
                  }
                  router.push(`/songs/${id}/add`);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                作成する
              </Button>
            </div>
          ) : (
            <>
              {/* 並び替えタブ */}
              <div className="mb-3 flex gap-2 text-xs">
                <Button
                  variant={sortOrder === "popular" ? "default" : "outline"}
                  size="sm"
                  className={
                    sortOrder === "popular"
                      ? "rounded-full border-rose-800 bg-rose-950/80 px-3 py-1 text-[11px] text-rose-200 hover:bg-rose-900/80"
                      : "rounded-full border-zinc-700 px-3 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }
                  onClick={() => setSortOrder("popular")}
                >
                  人気順
                </Button>
                <Button
                  variant={sortOrder === "newest" ? "default" : "outline"}
                  size="sm"
                  className={
                    sortOrder === "newest"
                      ? "rounded-full border-rose-800 bg-rose-950/80 px-3 py-1 text-[11px] text-rose-200 hover:bg-rose-900/80"
                      : "rounded-full border-zinc-700 px-3 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }
                  onClick={() => setSortOrder("newest")}
                >
                  新着順
                </Button>
              </div>
              <ul className="space-y-2">
                {callCharts.map((chart) => (
                  <li key={chart.id}>
                    <Link
                      href={`/songs/${id}/${chart.id}`}
                      className="flex h-14 flex-row items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900 active:scale-[0.99]"
                    >
                      <span className="min-w-0 truncate font-semibold text-zinc-100">
                        {chart.title || "（タイトルなし）"}
                      </span>
                      <div className="flex shrink-0 items-center gap-2 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span className="max-w-[80px] truncate text-zinc-300">
                            {chart.profiles?.username ?? "名無し"}
                          </span>
                        </span>
                        <span
                          className="flex items-center gap-1 tabular-nums"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <span className="min-w-[1.5rem] text-right">
                            {chart.like_count ?? 0}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleToggleBookmark(chart.id);
                            }}
                            title={bookmarkedChartIds.has(chart.id) ? "いいねを解除" : "いいね"}
                            aria-label={bookmarkedChartIds.has(chart.id) ? "いいねを解除" : "いいね"}
                          >
                            <Heart
                              className={`h-4 w-4 transition-colors ${
                                bookmarkedChartIds.has(chart.id)
                                  ? "text-rose-500 fill-rose-500"
                                  : "text-zinc-400"
                              }`}
                            />
                          </Button>
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <Link
          href={artistHref}
          className="mt-8 inline-block text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← アーティスト詳細に戻る
        </Link>

        <EditSongModal
          song={song ? { id: song.id, title: song.title, youtube_url: song.youtube_url, apple_music_url: song.apple_music_url, amazon_music_url: song.amazon_music_url } : null}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSaved={() => {
            void fetchSong();
          }}
        />
      </div>
    </main>
  );
}
