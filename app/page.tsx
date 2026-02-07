"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, ChevronRight, Reply, ListChecks, Music, Headphones } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Header } from "@/components/header";
import { useUserRole } from "@/hooks/useUserRole";
import { HorizontalScrollList } from "@/components/horizontal-scroll-list";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TOAST_NEWS_KEY = "toast_news_posted";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type LatestChartItem = {
  id: string;
  song_id: number | string | null;
  chart_title: string | null;
  song_title: string | null;
  created_at: string;
};

type LatestMixItem = {
  id: string;
  title: string | null;
  author_name: string | null;
  created_at: string;
};

function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export default function HomePage() {
  const { role } = useUserRole();
  const [toastNewsPosted, setToastNewsPosted] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [latestCharts, setLatestCharts] = useState<LatestChartItem[]>([]);
  const [latestMixes, setLatestMixes] = useState<LatestMixItem[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, content, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setNews((data ?? []).map((row) => ({
        id: row.id,
        title: row.title ?? "",
        content: row.content ?? "",
        created_at: row.created_at ?? "",
      })));
    };
    void fetchNews();
  }, []);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const [chartsRes, mixesRes] = await Promise.all([
          supabase
            .from("call_charts")
            .select(
              `
              id,
              song_id,
              title,
              created_at,
              songs (
                id,
                title
              )
            `,
            )
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("mixes")
            .select(
              `
              id,
              title,
              created_at,
              profiles!mixes_author_id_fkey (
                username
              )
            `,
            )
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (!chartsRes.error && chartsRes.data) {
          const mapped: LatestChartItem[] = (chartsRes.data as any[]).map(
            (row) => ({
              id: row.id,
              song_id: row.song_id ?? row.songs?.id ?? null,
              chart_title: row.title ?? null,
              song_title: row.songs?.title ?? null,
              created_at: row.created_at,
            }),
          );
          setLatestCharts(mapped);
        }

        if (!mixesRes.error && mixesRes.data) {
          const mappedMixes: LatestMixItem[] = (mixesRes.data as any[]).map(
            (row) => {
              const profile = Array.isArray(row.profiles)
                ? row.profiles[0]
                : row.profiles;
              return {
                id: row.id,
                title: row.title ?? null,
                author_name: profile?.username ?? null,
                created_at: row.created_at,
              };
            },
          );
          setLatestMixes(mappedMixes);
        }
      } catch (err) {
        console.error(
          "最新コール表 / MIX の取得エラー:",
          err instanceof Error ? err.message : JSON.stringify(err, null, 2),
        );
      }
    };

    void fetchLatest();
  }, []);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(TOAST_NEWS_KEY)) {
      setToastNewsPosted(true);
      sessionStorage.removeItem(TOAST_NEWS_KEY);
      const t = setTimeout(() => setToastNewsPosted(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-black pb-20 text-zinc-50">
      {toastNewsPosted && (
        <div className="sticky top-0 z-50 mx-3 mt-2 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-center text-xs font-medium text-emerald-200">
          お知らせを投稿しました
        </div>
      )}

      <Header />

      <section className="flex-1 px-3 py-4">
        <div className="mx-auto max-w-md">
          {/* 最新のお知らせリストのみ表示 */}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <Megaphone className="h-3.5 w-3.5 text-amber-500/80" />
                お知らせ
              </h2>
              {role === "admin" && (
                <Link
                  href="/admin/news"
                  className="text-[10px] text-zinc-500 hover:text-zinc-300"
                >
                  ＋投稿
                </Link>
              )}
            </div>
            <ul className="space-y-1.5">
              {news.length === 0 ? (
                <li className="py-1.5 text-[11px] text-zinc-500">
                  お知らせはまだありません
                </li>
              ) : (
                news.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-2 border-b border-zinc-800/80 py-1.5 last:border-0"
                  >
                    <span className="shrink-0 text-[10px] tabular-nums text-zinc-500">
                      {formatNewsDate(item.created_at)}
                    </span>
                    <span className="min-w-0 truncate text-xs font-medium text-zinc-200">
                      {item.title}
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-zinc-600" />
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* 新着コール表 */}
          <HorizontalScrollList
            title="🎵 新着コール表"
            items={latestCharts
              .filter((c) => c.song_id != null)
              .map((c) => ({
                id: c.id,
                href: `/songs/${c.song_id}/${c.id}`,
                title: c.song_title ?? "（曲名未設定）",
                subtitle: c.chart_title ?? "（タイトルなし）",
                meta: c.created_at,
                icon: <Music className="h-4 w-4" />,
              }))}
          />

          {/* 新着MIX */}
          <HorizontalScrollList
            title="🎧 新着MIX"
            items={latestMixes.map((m) => ({
              id: m.id,
              href: `/mixes/${m.id}`,
              title: m.title ?? "（タイトルなし）",
              subtitle: m.author_name ?? "名無し",
              meta: m.created_at,
              icon: <Headphones className="h-4 w-4" />,
            }))}
          />

          {/* 運営回答・リクエスト: 1列スリムリスト */}
          <nav className="mt-4 flex flex-col gap-2" aria-label="メイン操作">
            <Link
              href="/replies"
              className="flex h-12 flex-row items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50 active:scale-[0.99]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Reply className="h-5 w-5 shrink-0 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">
                  運営からの回答・アップデート
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
            </Link>
            <Link
              href="/requests"
              className="flex h-12 flex-row items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50 active:scale-[0.99]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ListChecks className="h-5 w-5 shrink-0 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">
                  リクエスト
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
            </Link>
          </nav>
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-3 py-2">
        <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-2 text-center text-xs text-zinc-500">
          <Link href="/terms" className="hover:text-zinc-300">
            利用規約
          </Link>
          <span className="text-zinc-700">|</span>
          <Link href="/privacy" className="hover:text-zinc-300">
            プライバシーポリシー
          </Link>
        </div>
      </footer>
    </main>
  );
}
