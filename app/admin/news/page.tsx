"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Newspaper, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RichEditor } from "@/components/rich-editor";
import { useUserRole } from "@/hooks/useUserRole";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TOAST_KEY = "toast_news_posted";

export default function AdminNewsPage() {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleLoading) return;
    if (role !== "admin") {
      router.replace("/");
      return;
    }
  }, [role, roleLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    const hasText = content.replace(/<[^>]*>/g, "").trim().length > 0;
    if (!hasText) {
      setError("本文を入力してください");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      setError("ログインが必要です");
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("news").insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
      });

      if (insertError) throw insertError;

      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(TOAST_KEY, "1");
      }
      router.push("/");
    } catch (err) {
      console.error("お知らせ投稿エラー:", err);
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (roleLoading || role !== "admin") {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/admin/requests"
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            管理画面に戻る
          </Link>
        </div>

        <header className="mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-fuchsia-400" />
            <h1 className="text-xl font-bold tracking-tight">お知らせを投稿</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            サイトの更新情報やコラムを発信します。
          </p>
        </header>

        <Card className="rounded-xl border border-zinc-800 bg-zinc-950/80">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {error && (
                <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="news-title" className="text-xs font-medium text-zinc-400">
                  タイトル <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="news-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="お知らせのタイトル"
                  className="rounded-lg text-zinc-100 placeholder:text-zinc-500"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="news-content" className="text-xs font-medium text-zinc-400">
                  本文 <span className="text-red-400">*</span>
                </Label>
                <RichEditor content={content} onChange={setContent} />
              </div>

              <Button
                type="submit"
                className="h-9 w-full rounded-lg text-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  "公開する"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
