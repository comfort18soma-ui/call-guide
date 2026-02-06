"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Loader2, ListMusic, Mic2, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = {
  id: string;
  username: string | null;
  handle: string | null;
  x_link: string | null;
};

type MixRow = {
  id: string;
  title: string | null;
  created_at: string;
};

type ChartRow = {
  id: string;
  title: string | null;
  created_at: string;
  songs: { title?: string | null } | null;
};

type BoardRow = {
  id: string;
  group_name: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  created_at: string;
  status: string;
};

type TabKey = "mixes" | "charts" | "boards";

export default function PublicUserProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mixList, setMixList] = useState<MixRow[]>([]);
  const [chartList, setChartList] = useState<ChartRow[]>([]);
  const [boardList, setBoardList] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("mixes");

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setError("ユーザーIDが指定されていません");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // UUIDの正規表現チェック
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        let profileQuery = supabase
          .from("profiles")
          .select("id, username, handle, x_link");

        if (isUuid) {
          // システムID (UUID) で検索
          profileQuery = profileQuery.eq("id", userId);
        } else {
          // ユーザーID (handle) で検索
          profileQuery = profileQuery.eq("handle", userId);
        }

        const { data: profileData, error: profileError } = await profileQuery.maybeSingle();

        if (profileError) {
          console.error("プロフィール取得エラー:", profileError);
          throw profileError;
        }

        if (!profileData) {
          setError("ユーザーが見つかりません");
          setLoading(false);
          return;
        }

        setProfile(profileData as Profile);
        const profileUserId = profileData.id;

        // 2. ユーザーの投稿データを取得
        const [mixesRes, chartsRes, boardsRes] = await Promise.all([
          supabase
            .from("mixes")
            .select("id, title, created_at")
            .eq("author_id", profileUserId)
            .order("created_at", { ascending: false }),
          supabase
            .from("call_charts")
            .select("id, title, created_at, songs(title)")
            .eq("author_id", profileUserId)
            .order("created_at", { ascending: false }),
          supabase
            .from("bulletin_boards")
            .select("id, group_name, event_date, event_time, location, created_at, status")
            .eq("user_id", profileUserId)
            .eq("status", "approved")
            .order("created_at", { ascending: false }),
        ]);

        if (mixesRes.error) throw mixesRes.error;
        if (chartsRes.error) throw chartsRes.error;
        if (boardsRes.error) throw boardsRes.error;

        setMixList((mixesRes.data ?? []) as MixRow[]);
        setChartList((chartsRes.data ?? []) as ChartRow[]);
        setBoardList((boardsRes.data ?? []) as BoardRow[]);
      } catch (err: any) {
        console.error("データ取得エラー:", err);
        setError(err?.message || "データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [userId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <h1 className="mb-4 text-xl font-semibold tracking-tight">ユーザープロフィール</h1>
          <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
            <CardContent className="p-6 text-center text-sm text-zinc-400">
              {error || "ユーザーが見つかりません"}
            </CardContent>
          </Card>
          <Button asChild className="mt-4 w-full rounded-xl" size="lg">
            <Link href="/">トップへ戻る</Link>
          </Button>
        </div>
      </main>
    );
  }

  const displayName = profile.username || "名無し";

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">{displayName}</h1>
          <p className="mt-1 text-sm text-zinc-400">@{profile.handle || "—"}</p>
          {profile.x_link && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-3 rounded-xl border-zinc-700 text-zinc-300 hover:text-zinc-100"
            >
              <a href={profile.x_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Xで見る
              </a>
            </Button>
          )}
        </div>

        {/* タブ切り替え */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
          <div className="mb-6">
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
              <SelectTrigger className="w-full rounded-xl border-zinc-700 bg-zinc-900 text-zinc-100 h-12">
                <SelectValue placeholder="表示する項目を選択" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                <SelectItem value="mixes">🎵 投稿したMIX</SelectItem>
                <SelectItem value="charts">🎤 投稿したコール表</SelectItem>
                <SelectItem value="boards">📅 投稿したイベント</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* MIX */}
          <TabsContent value="mixes" className="mt-0">
            {mixList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                投稿したMIXはまだありません。
              </div>
            ) : (
              <ul className="space-y-2">
                {mixList.map((m) => (
                  <li key={m.id}>
                    <Link href={`/mixes/${m.id}`}>
                      <Card className="rounded-xl border-zinc-800 bg-zinc-950/80 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
                        <CardContent className="flex items-center gap-3 p-4">
                          <ListMusic className="h-4 w-4 shrink-0 text-zinc-500" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-zinc-100">{m.title ?? "（タイトルなし）"}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              投稿日: {new Date(m.created_at).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* コール表 */}
          <TabsContent value="charts" className="mt-0">
            {chartList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                投稿したコール表はまだありません。
              </div>
            ) : (
              <ul className="space-y-2">
                {chartList.map((c) => {
                  const songTitle = c.songs?.title ?? "（曲名なし）";
                  const chartTitle = c.title ?? "（タイトルなし）";
                  return (
                    <li key={c.id}>
                      <Card className="rounded-xl border-zinc-800 bg-zinc-950/80 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
                        <CardContent className="flex items-center gap-3 p-4">
                          <Mic2 className="h-4 w-4 shrink-0 text-zinc-500" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-zinc-100">{songTitle}</p>
                            <p className="text-xs text-zinc-500">{chartTitle}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              投稿日: {new Date(c.created_at).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          {/* 掲示板 */}
          <TabsContent value="boards" className="mt-0">
            {boardList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                投稿したイベントはまだありません。
              </div>
            ) : (
              <ul className="space-y-2">
                {boardList.map((b) => {
                  const eventDateLabel = b.event_date
                    ? new Date(b.event_date).toLocaleDateString("ja-JP")
                    : "日付未設定";
                  const eventTimeLabel = b.event_time ? ` ${b.event_time}` : "";
                  return (
                    <li key={b.id}>
                      <Link href={`/board/${b.event_date}`}>
                        <Card className="rounded-xl border-zinc-800 bg-zinc-950/80 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
                          <CardContent className="flex items-center gap-3 p-4">
                            <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-zinc-100">{b.group_name ?? "（グループ名なし）"}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {eventDateLabel}
                                {eventTimeLabel}
                                {b.location ? ` ・ ${b.location}` : ""}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
