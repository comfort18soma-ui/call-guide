"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, UserPlus, Check, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ActionButtonsProps = {
  mixId: string;
  authorName: string | null;
};

export function ActionButtons({ mixId, authorName }: ActionButtonsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarkCategory, setBookmarkCategory] = useState<"practice" | "favorite" | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      setBookmarkCategory(null);
      setIsFollowing(false);
      setLoading(false);
      return;
    }

    try {
      const [bookmarkRes, followRes] = await Promise.all([
        supabase
          .from("bookmarks")
          .select("category")
          .eq("user_id", uid)
          .eq("mix_id", mixId)
          .maybeSingle(),
        authorName
          ? supabase
              .from("follows")
              .select("id")
              .eq("user_id", uid)
              .eq("target_author_name", authorName)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (bookmarkRes.data != null && (bookmarkRes.data.category === "practice" || bookmarkRes.data.category === "favorite")) {
        setBookmarkCategory(bookmarkRes.data.category);
      } else {
        setBookmarkCategory(null);
      }
      setIsFollowing(!!(authorName && followRes.data));
    } catch {
      setBookmarkCategory(null);
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  }, [mixId, authorName]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadStatus();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadStatus]);

  const isBookmarked = bookmarkCategory !== null;

  const handleToggleBookmark = async () => {
    if (!userId) {
      alert("ログインが必要です");
      return;
    }
    const currentlyBookmarked = isBookmarked;
    setBusy("bookmark");
    setBookmarkCategory(currentlyBookmarked ? null : "practice");
    try {
      if (currentlyBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("mix_id", mixId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert({
          user_id: userId,
          mix_id: mixId,
          call_chart_id: null,
          category: "practice",
        });
        if (error && error.code !== "23505") throw error;
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") return;
      setBookmarkCategory(currentlyBookmarked ? "practice" : null);
      console.error("Bookmark error:", err);
      alert(currentlyBookmarked ? "ブックマークの解除に失敗しました" : "登録に失敗しました");
    } finally {
      setBusy(null);
    }
  };

  const handleFollowToggle = async () => {
    if (!userId || !authorName) return;
    setBusy("follow");
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("user_id", userId)
          .eq("target_author_name", authorName);
        if (error) throw error;
        setIsFollowing(false);
      } else {
        const { error } = await supabase.from("follows").insert({
          user_id: userId,
          target_author_name: authorName,
        });
        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow error:", err);
      alert("フォローの更新に失敗しました");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 作成者フォロー（authorName があるときのみ） */}
      {authorName && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">作成者: {authorName}</span>
          {userId ? (
            <Button
              type="button"
              variant={isFollowing ? "secondary" : "outline"}
              size="sm"
              className={
                isFollowing
                  ? "h-8 rounded-full border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50"
                  : "h-8 rounded-full border-zinc-700"
              }
              onClick={handleFollowToggle}
              disabled={busy === "follow"}
            >
              {busy === "follow" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isFollowing ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  フォロー中
                </>
              ) : (
                <>
                  <UserPlus className="mr-1 h-3.5 w-3.5" />
                  フォロー
                </>
              )}
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="h-8 rounded-full border-zinc-700">
              <Link href="/login">
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                フォロー
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* ブックマーク（保存）ボタン */}
      <div className="flex flex-wrap gap-2 justify-end">
        {userId ? (
          <Button
            type="button"
            variant={bookmarkCategory ? "secondary" : "outline"}
            size="sm"
            className={
              bookmarkCategory
                ? "h-9 rounded-xl border-amber-700 bg-amber-950/50 text-amber-200 hover:bg-amber-900/50"
                : "h-9 rounded-xl border-zinc-700"
            }
            onClick={handleToggleBookmark}
            disabled={busy !== null}
          >
            {busy === "bookmark" ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <BookOpen
                className={`mr-1.5 h-4 w-4 ${bookmarkCategory ? "fill-amber-400 text-amber-400" : "text-zinc-400"}`}
              />
            )}
            {bookmarkCategory ? "ブックマーク済み" : "ブックマーク（保存）"}
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="h-9 rounded-xl border-zinc-700">
            <Link href="/login">
              <BookOpen className="mr-1.5 h-4 w-4" />
              ブックマーク（保存）
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
