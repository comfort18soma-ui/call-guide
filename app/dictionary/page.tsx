"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Copy, Check, Search, User, Bookmark } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Mix = {
  id: string;
  title: string;
  content: string;
  bars?: string | number | null;
  created_at: string;
  author_id?: string | null;
  author_name?: string | null;
  bookmark_count?: number;
  profiles?: { username: string | null; handle: string | null } | null;
};

export default function DictionaryPage() {
  const supabase = useMemo(
    () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadMixes = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("mixes")
          .select(`
            id,
            title,
            content,
            bars,
            created_at,
            author_id,
            bookmark_count,
            profiles!mixes_author_id_fkey (
              username,
              handle
            )
          `)
          .order("bookmark_count", { ascending: false })
          .order("title", { ascending: true });

        if (fetchError) throw fetchError;
        setMixes((data as Mix[]) ?? []);
      } catch (err) {
        console.warn("人気順での取得に失敗、新着順で再試行します", err);
        try {
          const { data: fallbackData } = await supabase
            .from("mixes")
            .select(`
              id,
              title,
              content,
              bars,
              created_at,
              author_id,
              bookmark_count,
              profiles!mixes_author_id_fkey (
                username,
                handle
              )
            `)
            .order("created_at", { ascending: false })
            .order("title", { ascending: true });
          setMixes((fallbackData as Mix[]) ?? []);
          setError(null);
        } catch (fallbackErr) {
          const message = fallbackErr instanceof Error ? fallbackErr.message : "データの取得に失敗しました";
          setError(message);
          setMixes([]);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadMixes();
  }, []);

  const filteredMixes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mixes;
    return mixes.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.bars != null && String(m.bars).toLowerCase().includes(q))
    );
  }, [mixes, searchQuery]);

  const groupedByBars = useMemo(() => {
    const map = new Map<string, Mix[]>();
    for (const mix of filteredMixes) {
      const key = mix.bars != null ? String(mix.bars) : "不明";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(mix);
    }
    return Array.from(map.entries()).sort(([keyA], [keyB]) => {
      if (keyA === "不明") return 1;
      if (keyB === "不明") return -1;
      return Number(keyA) - Number(keyB);
    });
  }, [filteredMixes]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-zinc-300" />
            <h1 className="text-xl font-semibold tracking-tight">Mix辞典</h1>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            MIX やお決まりのフレーズなど、ライブで使われるコール用語をまとめた辞書です。
          </p>
        </header>

        {/* 検索バー */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="名前や小節・分類で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-lg border-zinc-800 bg-zinc-900/50 pl-10 pr-3 text-sm"
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="mb-4 rounded-xl border-red-500/60 bg-red-500/10">
            <CardContent className="p-4 text-sm text-red-200">
              {error}
            </CardContent>
          </Card>
        )}

        {/* ローディング */}
        {loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-8 text-center text-sm text-zinc-500">
            読み込み中...
          </div>
        )}

        {/* グループ化表示（bars ごと） */}
        {!loading && !error && (
          <div className="space-y-6">
            {groupedByBars.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-6 text-center text-sm text-zinc-500">
                {searchQuery.trim() ? "該当するMixがありません" : "Mixが登録されていません"}
              </div>
            ) : (
              groupedByBars.map(([bars, items]) => (
                <section key={bars}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <span className="text-base">🟢</span>
                    {bars}
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {items.length}
                    </Badge>
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {items.map((mix) => (
                      <AccordionItem key={mix.id} value={mix.id}>
                        <AccordionTrigger className="group flex flex-row flex-nowrap items-center justify-between gap-2 px-3 py-2 text-left hover:no-underline [&>svg]:shrink-0">
                          <Link
                            href={`/mixes/${mix.id}`}
                            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-zinc-100 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {mix.title}
                          </Link>
                          <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-400">
                            <span className="flex items-center gap-0.5 tabular-nums">
                              <Bookmark className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                              <span>{mix.bookmark_count ?? 0}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0" />
                              {(() => {
                                const profile = Array.isArray(mix.profiles) ? mix.profiles[0] : mix.profiles;
                                const displayName = profile?.username || mix.author_name || "名無し";
                                const userHref = profile?.handle || mix.author_id;
                                return userHref ? (
                                  <Link
                                    href={`/users/${userHref}`}
                                    className="max-w-[80px] truncate hover:underline hover:text-zinc-200 sm:max-w-none"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {displayName}
                                  </Link>
                                ) : (
                                  <span className="max-w-[80px] truncate sm:max-w-none">{displayName}</span>
                                );
                              })()}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                                  コール内容
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 rounded-full px-2 text-[10px]"
                                  onClick={() => handleCopy(mix.content, mix.id)}
                                >
                                  {copiedId === mix.id ? (
                                    <>
                                      <Check className="mr-1 h-3 w-3 text-emerald-400" />
                                      コピー済み
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="mr-1 h-3 w-3" />
                                      コピー
                                    </>
                                  )}
                                </Button>
                              </div>
                              <p className="select-all break-words text-sm font-medium leading-relaxed text-zinc-100">
                                {mix.content}
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ))
            )}
          </div>
        )}

        {!loading && !error && groupedByBars.length > 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-4 text-center text-xs text-zinc-500">
            各Mixの詳細ページでは、実際の使用例や楽曲へのリンクを確認できます。
          </div>
        )}
      </div>
    </main>
  );
}
