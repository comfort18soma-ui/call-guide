"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = {
  nickname?: string | null;
  username?: string | null;
  handle?: string | null;
} | null;

function getDisplayName(profile: Profile): string {
  const name = profile?.nickname || profile?.username || "";
  return (typeof name === "string" && name.trim()) ? name.trim() : "名無し";
}

export function UsernameForm() {
  const [userName, setUserName] = useState("");
  const [handle, setHandle] = useState("");
  const [initialHandle, setInitialHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setUserName("名無し");
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, handle")
        .eq("id", user.id)
        .single();
      setUserName(getDisplayName(profile as Profile));
      const profileHandle = (profile as Profile)?.handle;
      setHandle(profileHandle ?? "");
      setInitialHandle(profileHandle);
      setLoading(false);
    };
    void load();
  }, []);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      alert("ログインが必要です");
      return;
    }

    // handle が既に設定されている場合は保存しない
    if (initialHandle) {
      return;
    }

    // バリデーション
    if (!handle.trim()) {
      alert("ユーザーIDを入力してください");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(handle.trim())) {
      alert("ユーザーIDは半角英数字とアンダースコア(_)のみ使用できます");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ handle: handle.trim() })
        .eq("id", user.id);

      if (error) {
        // 重複エラー（PostgreSQL の unique constraint violation）
        if (error.code === "23505") {
          alert("このIDは既に使用されています");
          return;
        }
        throw error;
      }

      setInitialHandle(handle.trim());
      alert("ユーザーIDを設定しました");
    } catch (err) {
      console.error("ユーザーID保存エラー:", err);
      alert("ユーザーIDの保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    );
  }

  const isHandleDisabled = !!initialHandle;

  return (
    <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username-display" className="text-xs text-zinc-400">
            ユーザー名
          </Label>
          <p className="text-sm font-medium text-zinc-100">{userName}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="handle-input" className="text-xs text-zinc-400">
            ユーザーID (handle)
          </Label>
          <Input
            id="handle-input"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            disabled={isHandleDisabled}
            pattern="^[a-zA-Z0-9_]+$"
            className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
            placeholder="例: user123"
          />
          <p className="text-xs text-zinc-500">
            {isHandleDisabled
              ? "※ユーザーIDは変更できません。"
              : "※設定後は変更できません。これがあなたのURLになります。"}
          </p>
        </div>

        {!isHandleDisabled && (
          <Button
            type="button"
            size="sm"
            className="w-full rounded-xl"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "保存中..." : "ユーザーIDを設定"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
