"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SignupPage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!userId.trim() || !email.trim() || !password.trim()) {
      setError("すべての項目を入力してください");
      return;
    }

    // ユーザーIDのバリデーション（半角英数字とアンダースコアのみ）
    if (!/^[a-zA-Z0-9_]+$/.test(userId.trim())) {
      setError("ユーザーIDは半角英数字とアンダースコア(_)のみ使用できます");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            handle: userId.trim(),
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        // 重複エラー（PostgreSQL の unique constraint violation）
        if (authError.code === "23505" || authError.message.includes("duplicate")) {
          setError("このユーザーIDは既に使用されています");
          return;
        }
        throw authError;
      }

      // 新規登録成功 - メール確認待ち状態にする
      setEmailSent(true);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "新規登録に失敗しました";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-zinc-300" />
            <h1 className="text-xl font-semibold tracking-tight">新規登録</h1>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            ユーザーID、メールアドレス、パスワードを入力してアカウントを作成します。
          </p>
        </header>

        {/* フォーム */}
        <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
          <CardContent className="p-5">
            {emailSent ? (
              /* メール送信成功メッセージ */
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-6 text-center">
                  <Mail className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
                  <p className="mb-2 text-sm font-semibold text-emerald-200">
                    📧 確認メールを送信しました！
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-100/80">
                    メール内のリンクをクリックして登録を完了してください。
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-zinc-800"
                  size="sm"
                >
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ログイン画面へ
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* エラー表示 */}
                {error && (
                  <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="signup-userid" className="text-sm font-medium text-zinc-300">
                    ユーザーID <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="signup-userid"
                    type="text"
                    placeholder="user123"
                    autoComplete="username"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    pattern="^[a-zA-Z0-9_]+$"
                    className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                    disabled={loading}
                    required
                  />
                  <p className="text-[10px] text-zinc-500">
                    半角英数字とアンダースコア(_)のみ使用できます。設定後は変更できません。
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-zinc-300">
                    メールアドレス <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-zinc-300">
                    パスワード <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="6文字以上"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                    disabled={loading}
                    required
                  />
                  <p className="text-[10px] text-zinc-500">6文字以上で入力してください</p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? "登録中..." : "登録する"}
                  </Button>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="text-xs text-zinc-400 underline hover:text-zinc-300"
                  >
                    すでにアカウントをお持ちの方はログイン
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
