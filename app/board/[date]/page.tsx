"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Calendar, MapPin, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type DateBoardPost = {
  id: string;
  event_date: string;
  event_time: string | null;
  location: string;
  description: string | null;
  x_id: string | null;
  images: string[] | null;
  created_at: string;
  user_id: string | null;
  category: string | null;
  group_name: string | null;
  live_title: string | null;
  profiles: { username: string | null } | null;
};

const getBoardCategoryLabel = (category: string | null) => {
  switch (category) {
    case "ground":
      return "地上";
    case "underground":
      return "地下アイドル";
    case "mens_underground":
      return "メン地下";
    case "other":
      return "その他";
    default:
      return "未設定";
  }
};

function getXUrl(hostXId: string): string {
  const raw = (hostXId || "").trim();
  if (!raw) return "https://x.com";
  let username = raw
    .replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\/?/i, "")
    .replace(/^@/, "")
    .split("/")[0]
    .split("?")[0];
  if (!username) username = raw;
  return `https://x.com/${encodeURIComponent(username)}`;
}

function getImageUrls(paths: string[] | null): string[] {
  if (!paths?.length) return [];
  return paths.map((p) => {
    const { data } = supabase.storage.from("board-uploads").getPublicUrl(p);
    return data.publicUrl;
  });
}

export default function BoardDatePage() {
  const params = useParams<{ date: string }>();
  const router = useRouter();
  const dateParam = params?.date;

  const [posts, setPosts] = useState<DateBoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateParam) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("bulletin_boards")
          .select(
            "id, event_date, event_time, location, description, x_id, images, user_id, created_at, status, category, group_name, live_title, profiles(username, handle)"
          )
          .eq("event_date", dateParam)
          .eq("status", "approved")
          .order("event_time", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts((data as DateBoardPost[]) ?? []);
      } catch (err) {
        console.error(err);
        setError("イベントの取得に失敗しました");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [dateParam]);

  const parsedDate = dateParam ? new Date(dateParam) : null;
  const titleDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
      : dateParam ?? "不明な日付";

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-950/30 via-black to-fuchsia-950/20 pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-rose-400" />
              <h1 className="text-xl font-bold tracking-tight">{titleDate}のイベント</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={() => router.push("/board")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              一覧へ戻る
            </Button>
          </div>
          <p className="text-sm text-zinc-400">この日に開催予定の募集一覧です。</p>
        </header>

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">読み込み中...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 py-12 text-center text-sm text-zinc-500">
            この日のイベントはありません
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const urls = getImageUrls(post.images ?? null);
              return (
                <Card
                  key={post.id}
                  className="overflow-hidden rounded-2xl border-rose-500/20 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 shadow-lg shadow-rose-500/5"
                >
                  <CardContent className="p-0">
                    {urls.length > 0 && (
                      <div className="flex gap-1 overflow-x-auto p-2 scrollbar-thin">
                        {urls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`告知 ${i + 1}`}
                            className="h-40 w-auto shrink-0 rounded-xl object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <div className="space-y-3 p-4">
                      <h3 className="font-bold text-zinc-100">
                        {post.group_name ?? "—"}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        投稿者:{" "}
                        {(post.profiles?.handle || post.user_id) ? (
                          <Link
                            href={post.profiles?.handle ? `/users/${post.profiles.handle}` : `/users/${post.user_id}`}
                            className="text-rose-300 hover:underline"
                          >
                            {post.profiles?.username || "名無しさん"}
                          </Link>
                        ) : (
                          <span>{post.profiles?.username || "名無しさん"}</span>
                        )}
                      </p>
                      {post.live_title?.trim() && (
                        <p className="text-sm text-zinc-400">{post.live_title}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge
                          variant="outline"
                          className="border-zinc-600 bg-zinc-800/80 text-zinc-300"
                        >
                          {getBoardCategoryLabel(post.category)}
                        </Badge>
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-rose-300">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(post.event_date).toLocaleDateString("ja-JP", {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                          })}
                          {post.event_time && ` ${post.event_time}`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-zinc-400">
                          <MapPin className="h-3.5 w-3.5" />
                          {post.location}
                        </span>
                      </div>
                      {post.description?.trim() && (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                          {post.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {post.x_id?.trim() && (
                          <a
                            href={getXUrl(post.x_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#1da1f2]/20 px-4 py-2 text-sm font-medium text-[#1da1f2] hover:bg-[#1da1f2]/30"
                          >
                            X で主を見る
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

