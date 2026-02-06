"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MessageSquare, ChevronLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ReplyRow = {
  id: string;
  content: string | null;
  response: string | null;
  category: string | null;
  created_at: string;
};

function categoryLabel(category: string | null | undefined): string {
  if (category === "request") return "機能改善";
  if (category === "other") return "その他";
  return "お問い合わせ";
}

type CategoryTab = "all" | "request" | "other";

export default function RepliesPage() {
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [items, setItems] = useState<ReplyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((item) => (item.category ?? "other") === activeTab);
  }, [items, activeTab]);

  useEffect(() => {
    const fetchReplies = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("replies")
          .select("id, content, response, category, created_at")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setItems((data as ReplyRow[]) ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "データの取得に失敗しました";
        setError(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchReplies();
  }, []);

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
          >
            <ChevronLeft className="h-5 w-5" />
            ホームに戻る
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-zinc-300" />
            <h1 className="text-xl font-semibold tracking-tight">運営だより（回答一覧）</h1>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            お問い合わせへの運営からの返信を掲載しています。
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* カテゴリタブ */}
        <div className="mb-4 flex gap-1 rounded-xl bg-zinc-900/80 p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`min-h-[44px] flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-white text-black"
                : "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("request")}
            className={`min-h-[44px] flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "request"
                ? "bg-white text-black"
                : "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            機能改善
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("other")}
            className={`min-h-[44px] flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "other"
                ? "bg-white text-black"
                : "bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            その他
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">読み込み中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 py-12 text-center text-sm text-zinc-500">
            {items.length === 0 ? "まだ回答はありません。" : "このカテゴリには回答がありません。"}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredItems.map((item) => (
              <Card key={item.id} className="rounded-xl border-zinc-800 bg-zinc-950/80">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-zinc-600 bg-zinc-800/80 text-zinc-300 text-[10px]"
                    >
                      {categoryLabel(item.category)}
                    </Badge>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(item.created_at).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-zinc-500">ご質問内容</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                      {item.content || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <p className="mb-1 text-[10px] font-medium text-emerald-300">運営からの返信</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-100">
                      {item.response || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
