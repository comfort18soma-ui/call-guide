"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookMarked,
  Heart,
  UserPlus,
  Loader2,
  Check,
  ChevronRight,
  Settings,
  ListMusic,
  Mic2,
  Calendar,
  Trash2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UsernameForm } from "@/components/username-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type BookmarkWithMix = {
  id: string;
  mix_id: string;
  category: string;
  created_at: string;
  mixes: { id: string; title: string } | null;
};

type BookmarkWithCallChart = {
  id: string;
  call_chart_id: string;
  category: string;
  created_at: string;
  call_charts: {
    id: string;
    song_id: number;
    title: string | null;
    songs: { title?: string; artists?: { name?: string } | null } | null;
  } | null;
};

type FollowRow = {
  id: string;
  target_author_name: string;
  created_at: string;
};

type MyMixRow = {
  id: string;
  title: string | null;
  created_at: string;
};

type MyChartRow = {
  id: string;
  title: string | null;
  created_at: string;
  songs: { title?: string | null } | null;
};

type MyBoardRow = {
  id: string;
  group_name: string | null;
  event_date: string | null;
  status: string;
  created_at: string;
};

type TabKey = "practice" | "favorites" | "following" | "my_mixes" | "my_charts" | "my_boards";

type BookmarkItem = BookmarkWithMix | BookmarkWithCallChart;

export default function MypagePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("practice");
  const [practiceList, setPracticeList] = useState<BookmarkWithMix[]>([]);
  const [favoritesList, setFavoritesList] = useState<BookmarkWithCallChart[]>([]);
  const [followingList, setFollowingList] = useState<FollowRow[]>([]);
  const [myMixList, setMyMixList] = useState<MyMixRow[]>([]);
  const [myChartList, setMyChartList] = useState<MyChartRow[]>([]);
  const [myBoardList, setMyBoardList] = useState<MyBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileXId, setProfileXId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // XのURLからIDを抽出する関数
  const extractXIdFromUrl = (url: string | null): string => {
    if (!url) return "";
    // https://x.com/shin_gen や https://twitter.com/shin_gen から shin_gen を抽出
    const match = url.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : url.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/^x\.com\//, "").replace(/^twitter\.com\//, "");
  };

  // XのIDをURLに変換する関数
  const convertXIdToUrl = (id: string): string | null => {
    const trimmed = id.trim();
    if (!trimmed) return null;
    return `https://x.com/${trimmed}`;
  };

  const loadAll = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setIsLoggedIn(false);
      setPracticeList([]);
      setFavoritesList([]);
      setFollowingList([]);
      setMyMixList([]);
      setMyChartList([]);
      setMyBoardList([]);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);
    setLoading(true);
    setError(null);
    const userId = session.user.id;

    try {
      const [
        bookmarksMixRes,
        bookmarksCallChartRes,
        followsRes,
        profileRes,
        myMixesRes,
        myChartsRes,
        myBoardsRes,
      ] = await Promise.all([
        supabase
          .from("bookmarks")
          .select("id, mix_id, category, created_at, mixes(id, title)")
          .eq("user_id", userId)
          .not("mix_id", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookmarks")
          .select("*, call_charts(*, songs(title, artists(name)))")
          .eq("user_id", userId)
          .not("call_chart_id", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("follows")
          .select("id, target_author_name, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("username, x_link")
          .eq("id", userId)
          .single(),
        supabase
          .from("mixes")
          .select("id, title, created_at")
          .eq("author_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("call_charts")
          .select("id, title, created_at, songs(title)")
          .eq("author_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("bulletin_boards")
          .select("id, group_name, event_date, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (bookmarksMixRes.error) throw bookmarksMixRes.error;
      if (bookmarksCallChartRes.error) throw bookmarksCallChartRes.error;
      if (followsRes.error) throw followsRes.error;
      if (profileRes.error) {
        // プロフィールは致命的ではないので警告だけにとどめる
        console.warn("プロフィール取得に失敗しました", profileRes.error);
      }
      if (myMixesRes.error) throw myMixesRes.error;
      if (myChartsRes.error) throw myChartsRes.error;
      if (myBoardsRes.error) throw myBoardsRes.error;

      const allMixBookmarks = (bookmarksMixRes.data ?? []) as unknown as BookmarkWithMix[];
      setPracticeList(allMixBookmarks.filter((b) => b.category === "practice"));
      setFavoritesList((bookmarksCallChartRes.data ?? []) as unknown as BookmarkWithCallChart[]);
      setFollowingList((followsRes.data ?? []) as unknown as FollowRow[]);
      setMyMixList((myMixesRes.data ?? []) as MyMixRow[]);
      setMyChartList((myChartsRes.data ?? []) as MyChartRow[]);
      setMyBoardList((myBoardsRes.data ?? []) as MyBoardRow[]);

      if (profileRes.data) {
        const { username, x_link } = profileRes.data as { username: string | null; x_link: string | null };
        setProfileUsername(username ?? "");
        setProfileXId(extractXIdFromUrl(x_link));
      }
    } catch (err: any) {
      console.error("🔥 Data Load Error:", err);

      // エラーオブジェクトから詳細なメッセージを取り出す
      const rawMessage =
        err?.message ||
        err?.details ||
        err?.error_description ||
        JSON.stringify(err);

      setError(`エラー詳細: ${rawMessage}`);

      setPracticeList([]);
      setFavoritesList([]);
      setFollowingList([]);
      setMyMixList([]);
      setMyChartList([]);
      setMyBoardList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session?.user?.id;
      setIsLoggedIn(loggedIn);
      if (loggedIn) void loadAll();
    };
    void init();
  }, [loadAll]);

  const handleRemoveBookmark = async (e: React.MouseEvent, item: BookmarkItem) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      alert("ログインが必要です");
      return;
    }

    const isCallChart = "call_chart_id" in item && item.call_chart_id != null;
    const previousFavorites = favoritesList;
    const previousPractice = practiceList;

    if (isCallChart) {
      setFavoritesList((prev) => prev.filter((b) => b.id !== item.id));
    } else {
      setPracticeList((prev) => prev.filter((b) => b.id !== item.id));
    }

    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", item.id)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (err) {
      console.error("削除失敗:", err);
      // 失敗時はロールバック
      alert("削除できませんでした");
      if (isCallChart) setFavoritesList(previousFavorites);
      else setPracticeList(previousPractice);
    }
  };

  const handleCompletePractice = async (bookmarkId: string) => {
    setUpdatingId(bookmarkId);
    try {
      const { error: updateError } = await supabase
        .from("bookmarks")
        .update({ category: "favorite" })
        .eq("id", bookmarkId);

      if (updateError) throw updateError;

      const moved = practiceList.find((b) => b.id === bookmarkId);
      if (moved) {
        setPracticeList((prev) => prev.filter((b) => b.id !== bookmarkId));
        setFavoritesList((prev) => [moved as any, ...prev]);
      }
    } catch (err) {
      console.error("習得完了エラー:", err);
      alert("更新に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMyMix = async (mixId: string) => {
    if (!window.confirm("このMIXを削除しますか？この操作は取り消せません。")) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      alert("ログインが必要です");
      return;
    }

    try {
      const { error } = await supabase
        .from("mixes")
        .delete()
        .eq("id", mixId)
        .eq("user_id", userId);

      if (error) throw error;

      setMyMixList((prev) => prev.filter((m) => m.id !== mixId));
      alert("MIXを削除しました");
    } catch (err) {
      console.error("MIX削除エラー:", err);
      alert("MIXの削除に失敗しました");
    }
  };

  const handleDeleteMyChart = async (chartId: string) => {
    if (!window.confirm("このコール表を削除しますか？この操作は取り消せません。")) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      alert("ログインが必要です");
      return;
    }

    try {
      const { error } = await supabase
        .from("call_charts")
        .delete()
        .eq("id", chartId)
        .eq("user_id", userId);

      if (error) throw error;

      setMyChartList((prev) => prev.filter((c) => c.id !== chartId));
      alert("コール表を削除しました");
    } catch (err) {
      console.error(
        "コール表削除エラー詳細:",
        err instanceof Error ? err.message : JSON.stringify(err, null, 2),
      );
      alert("コール表の削除に失敗しました");
    }
  };

  const handleDeleteMyBoard = async (boardId: string) => {
    if (!window.confirm("この掲示板募集を削除しますか？この操作は取り消せません。")) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      alert("ログインが必要です");
      return;
    }

    try {
      const { error } = await supabase
        .from("bulletin_boards")
        .delete()
        .eq("id", boardId)
        .eq("user_id", userId);

      if (error) throw error;

      setMyBoardList((prev) => prev.filter((b) => b.id !== boardId));
      alert("掲示板募集を削除しました");
    } catch (err) {
      console.error("掲示板削除エラー:", err);
      alert("掲示板募集の削除に失敗しました");
    }
  };

  const handleSaveProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      alert("ログインが必要です");
      return;
    }
    setSavingProfile(true);
    try {
      const xLinkUrl = convertXIdToUrl(profileXId);
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profileUsername.trim() || null,
          x_link: xLinkUrl,
        })
        .eq("id", userId);

      if (error) throw error;
      alert("プロフィールを保存しました");
    } catch (err) {
      console.error("プロフィール保存エラー:", err);
      alert("プロフィールの保存に失敗しました");
    } finally {
      setSavingProfile(false);
    }
  };

  // X ID入力のサニタイズ処理
  const handleXIdChange = (value: string) => {
    // @マークを削除
    let sanitized = value.replace(/@/g, "");
    // URLが貼り付けられた場合はID部分だけ抽出
    if (sanitized.includes("x.com/") || sanitized.includes("twitter.com/")) {
      sanitized = extractXIdFromUrl(sanitized);
    }
    // 半角英数字とアンダースコア以外を削除
    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, "");
    setProfileXId(sanitized);
  };

  if (isLoggedIn === null) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </main>
    );
  }

  if (isLoggedIn === false) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <h1 className="mb-4 text-xl font-semibold tracking-tight">マイページ</h1>
          <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
            <CardContent className="p-6 text-center text-sm text-zinc-400">
              ログインすると、覚えたいMIX・お気に入り・フォロー中の作成者を管理できます。
            </CardContent>
          </Card>
          <Button asChild className="mt-4 w-full rounded-xl" size="lg">
            <Link href="/login">ログイン</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold tracking-tight">マイページ</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white">
                <Settings className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">設定</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <UsernameForm />
                <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
                  <CardContent className="p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-100">プロフィール編集</h2>
                    <div className="space-y-2">
                      <Label htmlFor="profile-username" className="text-xs text-zinc-400">
                        ユーザー名
                      </Label>
                      <Input
                        id="profile-username"
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                        placeholder="表示したい名前"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-x" className="text-xs text-zinc-400">
                        X (Twitter) ユーザーID
                      </Label>
                      <div className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-950">
                        <span className="px-3 text-sm text-zinc-400">x.com/</span>
                        <Input
                          id="profile-x"
                          type="text"
                          value={profileXId}
                          onChange={(e) => handleXIdChange(e.target.value)}
                          className="flex-1 border-0 bg-transparent text-zinc-100 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="@なしで入力 (例: shin_gen)"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        半角英数字とアンダースコア(_)のみ使用できます
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-1 rounded-xl"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "保存中..." : "保存"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
          <div className="mb-6">
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
              <SelectTrigger className="w-full rounded-xl border-zinc-700 bg-zinc-900 text-zinc-100 h-12">
                <SelectValue placeholder="表示する項目を選択" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                <SelectItem value="practice">📖 覚えたいMIX</SelectItem>
                <SelectItem value="favorites">❤️ お気に入り</SelectItem>
                <SelectItem value="following">👤 フォロー中</SelectItem>
                <div className="my-1 border-t border-zinc-800" />
                <SelectItem value="my_mixes">🎵 投稿したMIX</SelectItem>
                <SelectItem value="my_charts">🎤 投稿したコール表</SelectItem>
                <SelectItem value="my_boards">📅 投稿したイベント</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="practice" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : practiceList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                覚えたいMIXはまだありません。
                <br />
                MIX詳細ページから「覚えたい」に追加できます。
              </div>
            ) : (
              <ul className="space-y-3">
                {practiceList.map((b) => (
                  <li key={b.id}>
                    <Card className="rounded-xl border-amber-900/60 bg-zinc-950/80">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <Link
                          href={`/mixes/${b.mix_id}`}
                          className="min-w-0 flex-1 font-medium text-zinc-100 hover:underline"
                        >
                          {b.mixes?.title ?? "（タイトルなし）"}
                        </Link>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 rounded-full p-2 hover:bg-zinc-800 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveBookmark(e, b);
                          }}
                          title="ブックマークを解除"
                          aria-label="ブックマークを解除"
                        >
                          <BookMarked className="h-5 w-5 fill-amber-400 text-amber-400" />
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : favoritesList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                お気に入りのコール表はまだありません。
                <br />
                曲詳細ページからコール表をブックマークできます。
              </div>
            ) : (
              <ul className="space-y-2">
                {favoritesList.map((b) => {
                  const chart = b.call_charts;
                  const songTitle = chart?.songs?.title ?? "（曲名なし）";
                  const artistName =
                    (chart?.songs?.artists && typeof chart.songs.artists === "object" && "name" in chart.songs.artists
                      ? (chart.songs.artists as { name?: string }).name
                      : null) ?? "—";
                  const chartTitle = chart?.title ?? "（タイトルなし）";
                  const songId = chart?.song_id;
                  return (
                    <li key={b.id}>
                      <Card className="rounded-xl border-zinc-800 bg-zinc-950/80 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
                        <CardContent className="flex items-center gap-3 p-4">
                          <Link
                            href={songId != null ? `/songs/${songId}` : "#"}
                            className={`min-w-0 flex-1 ${songId == null ? "pointer-events-none" : ""}`}
                          >
                            <div>
                              <p className="font-medium text-zinc-100">{songTitle}</p>
                              <p className="text-xs text-zinc-500">{artistName}</p>
                              <p className="mt-0.5 text-sm text-zinc-400">{chartTitle}</p>
                            </div>
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                          </Link>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 rounded-full p-2 hover:bg-zinc-800 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveBookmark(e, b);
                            }}
                            title="ブックマークを解除"
                            aria-label="ブックマークを解除"
                          >
                            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : followingList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                フォロー中の作成者はまだいません。
              </div>
            ) : (
              <ul className="space-y-2">
                {followingList.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/search?q=${encodeURIComponent(f.target_author_name)}`}
                      className="block"
                    >
                      <Card className="rounded-xl border-zinc-800 bg-zinc-950/80 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
                        <CardContent className="flex items-center gap-3 p-4">
                          <UserPlus className="h-4 w-4 shrink-0 text-zinc-500" />
                          <span className="min-w-0 flex-1 font-medium text-zinc-100">
                            {f.target_author_name}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="my_mixes" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : myMixList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                あなたが投稿したMIXはまだありません。
              </div>
            ) : (
              <ul className="space-y-2">
                {myMixList.map((m) => (
                  <li key={m.id}>
                    <Card className="rounded-xl border-zinc-800 bg-zinc-950/80 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Link href={`/mixes/${m.id}`} className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-100">{m.title ?? "（タイトルなし）"}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            投稿日: {new Date(m.created_at).toLocaleDateString("ja-JP")}
                          </p>
                        </Link>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 rounded-full p-2 hover:bg-zinc-800 transition-colors"
                          onClick={() => handleDeleteMyMix(m.id)}
                          title="MIXを削除"
                          aria-label="MIXを削除"
                        >
                          <Trash2 className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="my_charts" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : myChartList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                あなたが投稿したコール表はまだありません。
              </div>
            ) : (
              <ul className="space-y-2">
                {myChartList.map((c) => {
                  const songTitle = c.songs?.title ?? "（曲名なし）";
                  const chartTitle = c.title ?? "（タイトルなし）";
                  return (
                    <li key={c.id}>
                      <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-zinc-100">{songTitle}</p>
                            <p className="text-xs text-zinc-500">{chartTitle}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              投稿日: {new Date(c.created_at).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 rounded-full p-2 hover:bg-zinc-800 transition-colors"
                            onClick={() => handleDeleteMyChart(c.id)}
                            title="コール表を削除"
                            aria-label="コール表を削除"
                          >
                            <Trash2 className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="my_boards" className="mt-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : myBoardList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center text-sm text-zinc-500">
                あなたが投稿した掲示板募集はまだありません。
              </div>
            ) : (
              <ul className="space-y-2">
                {myBoardList.map((b) => {
                  const eventDateLabel = b.event_date
                    ? new Date(b.event_date).toLocaleDateString("ja-JP")
                    : "日付未設定";
                  const statusLabel =
                    b.status === "approved" ? "公開中" : b.status === "pending" ? "承認待ち" : b.status;
                  return (
                    <li key={b.id}>
                      <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-zinc-100">{b.group_name ?? "（グループ名なし）"}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {eventDateLabel} ・ {statusLabel}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 rounded-full p-2 hover:bg-zinc-800 transition-colors"
                            onClick={() => handleDeleteMyBoard(b.id)}
                            title="掲示板募集を削除"
                            aria-label="掲示板募集を削除"
                          >
                            <Trash2 className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </CardContent>
                      </Card>
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
