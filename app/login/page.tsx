"use client";

import { useState } from "react";
import { LogIn, UserPlus, Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAuthErrorMessage,
  DEFAULT_LOGIN_ERROR,
  DEFAULT_SIGNUP_ERROR,
} from "@/lib/auth-errors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // 共通項目
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 新規登録専用項目
  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 状態管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!email.trim() || !password.trim()) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        throw authError;
      }

      // ログイン成功
      window.location.href = "/";
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "";
      setError(getAuthErrorMessage(rawMessage, DEFAULT_LOGIN_ERROR));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!email.trim() || !password.trim() || !username.trim() || !handle.trim() || !confirmPassword.trim()) {
      setError("すべての項目を入力してください");
      return;
    }

    // ユーザーIDのバリデーション（半角英数字とアンダースコアのみ）
    if (!/^[a-zA-Z0-9_]+$/.test(handle.trim())) {
      setError("ユーザーIDは半角英数字とアンダースコア(_)のみ使用できます");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードとパスワード確認が一致しません");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            handle: handle.trim(),
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
      const rawMessage = err instanceof Error ? err.message : "";
      setError(getAuthErrorMessage(rawMessage, DEFAULT_SIGNUP_ERROR));
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
            <LogIn className="h-5 w-5 text-zinc-300" />
            <h1 className="text-xl font-semibold tracking-tight">ログイン</h1>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            メールアドレスとパスワードでログイン、または新規登録します。
          </p>
        </header>

        {/* フォーム */}
        <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
          <CardContent className="p-5">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
              <TabsList className="mb-4 grid h-auto grid-cols-2 gap-1 rounded-xl bg-zinc-900 p-1">
                <TabsTrigger
                  value="login"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black"
                >
                  <LogIn className="h-4 w-4" />
                  ログイン
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black"
                >
                  <UserPlus className="h-4 w-4" />
                  新規登録
                </TabsTrigger>
              </TabsList>

              {/* エラー表示 */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              {/* ログインタブ */}
              <TabsContent value="login" className="space-y-4 text-xs">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium text-zinc-300">
                      メールアドレス <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="login-email"
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
                    <Label htmlFor="login-password" className="text-sm font-medium text-zinc-300">
                      パスワード <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full rounded-full"
                      size="sm"
                      disabled={loading}
                    >
                      {loading ? "ログイン中..." : "ログイン"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* 新規登録タブ */}
              <TabsContent value="signup" className="space-y-4 text-xs">
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
                      type="button"
                      variant="outline"
                      className="w-full rounded-full border-zinc-800"
                      size="sm"
                      onClick={() => {
                        setEmailSent(false);
                        setMode("login");
                        setEmail("");
                        setPassword("");
                        setUsername("");
                        setHandle("");
                        setConfirmPassword("");
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      ログイン画面に戻る
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-username" className="text-sm font-medium text-zinc-300">
                      ユーザー名 <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="ユーザー名を入力"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-handle" className="text-sm font-medium text-zinc-300">
                      ユーザーID <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="signup-handle"
                      type="text"
                      placeholder="半角英数字 (例: shin_gen)"
                      autoComplete="username"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
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
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-zinc-300">
                      パスワード確認 <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="パスワードを再入力"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={loading}
                      required
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[10px] text-red-400">パスワードが一致しません</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full rounded-full"
                      size="sm"
                      disabled={loading || (confirmPassword !== "" && password !== confirmPassword)}
                    >
                      {loading ? "登録中..." : "新規登録"}
                    </Button>
                  </div>
                </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
