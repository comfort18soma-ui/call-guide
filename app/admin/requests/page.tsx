"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  User,
  Music,
  Headphones,
  MessageSquare,
  LayoutGrid,
  Check,
  X,
  Reply,
  ExternalLink,
  FolderOpen,
  Calendar,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { getBoardCategoryLabel } from "@/lib/board-categories";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type RequestType = "artist" | "song" | "mix" | "inquiry";
type AdminTab = RequestType | "bulletin";
type RequestStatus = "pending" | "approved" | "rejected" | "replied" | "done";

type BulletinBoardRow = {
  id: string;
  event_date: string;
  location: string;
  description: string | null;
  x_id: string | null;
  images: string[] | null;
  user_id: string | null;
  created_at: string;
  status: string;
  category: string | null;
  group_name: string | null;
  live_title: string | null;
  profiles: { username: string | null; handle: string | null } | null;
};

type RequestRow = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  created_at: string;
  user_id?: string | null;
  artist_name?: string | null;
  artist_reading?: string | null;
  artist_x_url?: string | null;
  song_title?: string | null;
  related_artist_id?: string | null;
  youtube_url?: string | null;
  apple_music_url?: string | null;
  amazon_music_url?: string | null;
  mix_title?: string | null;
  mix_content?: string | null;
  mix_bars?: string | null;
  measures?: number | null;
  remarks?: string | null;
  reference_url?: string | null;
  song_id?: number | null;
  content?: string | null;
  admin_reply?: string | null;
  response?: string | null;
  responded_at?: string | null;
  category?: string | null;
};

type ArtistOption = {
  id: string;
  name: string;
};

export default function AdminRequestsPage() {
  const supabase = useMemo(
    () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("artist");
  const [filterCategory, setFilterCategory] = useState<"all" | "request" | "other">("all");
  const [bulletinPending, setBulletinPending] = useState<BulletinBoardRow[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [artistRequestsCount, setArtistRequestsCount] = useState(0);
  const [songRequestsCount, setSongRequestsCount] = useState(0);
  const [mixRequestsCount, setMixRequestsCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [bulletinCount, setBulletinCount] = useState(0);

  // ダイアログ状態
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [mixDetailDialogOpen, setMixDetailDialogOpen] = useState(false);
  const [selectedMixContent, setSelectedMixContent] = useState<string>("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingRequestId, setReplyingRequestId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [savingRequestId, setSavingRequestId] = useState<string | null>(null);

  // リクエスト一覧を取得
  const loadRequests = async (type: RequestType) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("requests")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setRequests((data as RequestRow[]) ?? []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "データの取得に失敗しました";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // アーティスト一覧を取得（楽曲タブで使用）
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("artists")
          .select("id, name")
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;
        setArtists((data as ArtistOption[]) ?? []);
      } catch (err) {
        console.error("Failed to load artists", err);
      }
    };

    void fetchArtists();
  }, []);

  // 掲示板（未承認）一覧を取得
  const loadBulletinPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("bulletin_boards")
        .select("id, user_id, event_date, location, description, x_id, images, status, created_at, category, group_name, live_title, profiles(username, handle)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (fetchError) {
        console.error("🔥 Board Fetch Error:", JSON.stringify(fetchError, null, 2));
        console.error("🔥 Error Message:", fetchError.message);
        console.error("🔥 Error Hint:", (fetchError as { hint?: string }).hint);
        throw fetchError;
      }
      setBulletinPending((data as unknown as BulletinBoardRow[]) ?? []);
      setBulletinCount((data as unknown as BulletinBoardRow[])?.length ?? 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "データの取得に失敗しました";
      setError(errorMessage);
      setBulletinPending([]);
    } finally {
      setLoading(false);
    }
  };

  // 各種未対応件数を取得
  const loadCounts = async () => {
    try {
      // reports: status が null または 'pending'
      const [{ count: reportsCnt }, { count: artistCnt }, { count: songCnt }, { count: mixCnt }, { count: inquiryCnt }, { count: bulletinCnt }] =
        await Promise.all([
          supabase
            .from("reports")
            .select("id", { count: "exact", head: true })
            .or("status.eq.pending,status.is.null"),
          supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("type", "artist")
            .eq("status", "pending"),
          supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("type", "song")
            .eq("status", "pending"),
          supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("type", "mix")
            .eq("status", "pending"),
          supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("type", "inquiry")
            .eq("status", "pending"),
          supabase
            .from("bulletin_boards")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
        ]);

      setReportsCount(reportsCnt ?? 0);
      setArtistRequestsCount(artistCnt ?? 0);
      setSongRequestsCount(songCnt ?? 0);
      setMixRequestsCount(mixCnt ?? 0);
      setInquiryCount(inquiryCnt ?? 0);
      setBulletinCount(bulletinCnt ?? 0);
    } catch (err) {
      console.error(
        "未対応件数の取得エラー:",
        err instanceof Error ? err.message : JSON.stringify(err, null, 2)
      );
    }
  };

  // タブ変更時にデータを再読み込み
  useEffect(() => {
    if (activeTab === "bulletin") {
      void loadBulletinPending();
    } else {
      void loadRequests(activeTab as RequestType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 初回マウント時に件数を取得
  useEffect(() => {
    void loadCounts();
  }, []);

  // 却下: 行を物理削除 → リストから即時除外（成功時アラートなし）
  // 承認: マスタ追加 → ステータス 'approved' 更新 → リストから即時除外（成功時アラートなし）
  const updateStatus = async (requestId: string, newStatus: RequestStatus) => {
    setSaving(true);
    try {
      if (newStatus === "rejected") {
        const { error: deleteError } = await supabase
          .from("requests")
          .delete()
          .eq("id", requestId);

        if (deleteError) throw deleteError;
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        return;
      }

      // 承認: タブに応じてマスタへ追加
      const req = requests.find((r) => r.id === requestId);
      if (!req) throw new Error("リクエストが見つかりません");

      if (newStatus === "approved") {
        console.log("承認処理開始:", { requestId, type: req.type, activeTab });
      }

      if (newStatus === "approved" && activeTab === "artist" && req.artist_name?.trim()) {
        const { error: insertError } = await supabase.from("artists").insert({
          name: req.artist_name.trim(),
          reading: req.artist_reading?.trim() ?? null, // 読み方
          x_url: req.artist_x_url?.trim() || null,
        });
        if (insertError) throw insertError;
        console.log("DB追加成功 (artists)");
      }

      if (newStatus === "approved" && activeTab === "song" && req.song_title?.trim()) {
        const { error: insertError } = await supabase.from("songs").insert({
          title: req.song_title.trim(),
          artist_id: req.related_artist_id ?? null,
          youtube_url: req.youtube_url?.trim() || null,
          apple_music_url: req.apple_music_url?.trim() || null,
          amazon_music_url: req.amazon_music_url?.trim() || null,
        });
        if (insertError) throw insertError;
        console.log("DB追加成功 (songs)");
      }

      if (newStatus === "approved" && activeTab === "mix" && req.mix_title?.trim()) {
        const barsNum =
          req.measures != null && !Number.isNaN(Number(req.measures))
            ? Number(req.measures)
            : req.mix_bars != null && req.mix_bars !== "" && !Number.isNaN(Number(req.mix_bars))
              ? Number(req.mix_bars)
              : null;
        const insertPayload = {
          song_id: req.song_id ?? null,
          title: (req.mix_title ?? "").trim(),
          content: (req.mix_content ?? "").trim(),
          bars: barsNum,
          reference_url: req.reference_url?.trim() || null,
          url: req.reference_url?.trim() || null,
          bookmark_count: 0,
          author_id: req.user_id ?? null,
        };
        const { error: insertError } = await supabase.from("mixes").insert(insertPayload);
        if (insertError) throw insertError;
        console.log("DB追加成功 (mixes)");
      }

      // 承認済みは履歴を残さず requests から物理削除
      const { error: deleteError } = await supabase
        .from("requests")
        .delete()
        .eq("id", requestId);

      if (deleteError) throw deleteError;

      // 画面のリストからも除外
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (newStatus === "approved") {
        console.log("リストから削除完了");
      }
    } catch (err: unknown) {
      console.error("承認エラー詳細:", JSON.stringify(err, null, 2));
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err);
      alert(`承認に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // 問い合わせ返信（ダイアログ）— replies に追加して requests から削除
  const handleReply = async () => {
    if (!replyingRequestId || !replyText.trim()) return;

    const req = requests.find((r) => r.id === replyingRequestId);
    if (!req) return;

    setSaving(true);
    try {
      const { error: insertError } = await supabase
        .from("replies")
        .insert({
          content: req.content ?? "",
          response: replyText.trim(),
          category: req.category ?? "other",
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("requests")
        .delete()
        .eq("id", replyingRequestId);

      if (deleteError) throw deleteError;

      setReplyDialogOpen(false);
      setReplyingRequestId(null);
      setReplyText("");
      await loadRequests(activeTab as any);
      alert("保存しました");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "返信の送信に失敗しました";
      alert(`エラー: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // 問い合わせ返信を保存（インライン）
  const handleSaveReply = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    const text = (replyDraft[requestId] ?? req?.response ?? req?.admin_reply ?? "").trim();
    if (!text || !req) return;

    setSavingRequestId(requestId);
    try {
      const { error: insertError } = await supabase
        .from("replies")
        .insert({
          content: req.content ?? "",
          response: text,
          category: req.category ?? "other",
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("requests")
        .delete()
        .eq("id", requestId);

      if (deleteError) throw deleteError;

      await loadRequests(activeTab as any);
      setReplyDraft((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      alert("保存しました");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "保存に失敗しました";
      alert(`エラー: ${errorMessage}`);
    } finally {
      setSavingRequestId(null);
    }
  };

  // 画像URLを取得
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    const { data } = supabase.storage.from("request-images").getPublicUrl(imagePath);
    return data.publicUrl;
  };

  // アーティスト名を取得
  const getArtistName = (artistId: string | null | undefined): string => {
    if (!artistId) return "未設定";
    const artist = artists.find((a) => a.id === artistId);
    return artist?.name ?? `ID: ${artistId}`;
  };

  // 掲示板画像URLを取得
  const getBoardImageUrls = (paths: string[] | null): string[] => {
    if (!paths?.length) return [];
    return paths.map((p) => supabase.storage.from("board-uploads").getPublicUrl(p).data.publicUrl);
  };

  // 掲示板: 承認
  const handleApproveBulletin = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("bulletin_boards")
        .update({ status: "approved" })
        .eq("id", id);

      if (error) throw error;

      // 承認された投稿を画面から即時に除外
      setBulletinPending((prev) => prev.filter((item) => item.id !== id));

      alert("承認しました");
    } catch (err) {
      console.error("承認エラー:", err);
      alert("承認に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // 掲示板: 却下（削除）
  const handleRejectBulletin = async (id: string) => {
    if (!window.confirm("この投稿を却下（削除）しますか？")) return;
    setSaving(true);
    try {
      const { error: e } = await supabase.from("bulletin_boards").delete().eq("id", id);
      if (e) throw e;
      setBulletinPending((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "却下に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // ステータスバッジ
  const StatusBadge = ({ status }: { status: RequestStatus }) => {
    const variants: Record<RequestStatus, { variant: "default" | "destructive" | "outline"; label: string; className?: string }> = {
      pending: { variant: "outline", label: "保留中", className: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" },
      approved: { variant: "default", label: "承認済み", className: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" },
      rejected: { variant: "destructive", label: "却下", className: "" },
      replied: { variant: "default", label: "返信済み", className: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" },
      done: { variant: "default", label: "完了", className: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // 現在のタブ（activeTab）に合わせてリクエストをフィルタリングする
  const filteredRequests = requests.filter((req) => {
    if (activeTab === "artist") return req.type === "artist";
    if (activeTab === "song") return req.type === "song";
    if (activeTab === "mix") return req.type === "mix";
    if (activeTab === "inquiry") {
      if (req.type !== "inquiry") return false;
      if (filterCategory === "all") return true;
      const category = req.category ?? "other";
      return category === filterCategory;
    }
    return false;
  });

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* ヘッダー */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">リクエスト管理</h1>
            <p className="mt-2 text-sm text-zinc-400">
              ユーザーからのリクエストを確認・処理します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/reports">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-amber-400" />
                通報・修正依頼一覧
                {reportsCount > 0 && (
                  <span className="ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {reportsCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/admin/manage">
              <Button variant="outline" size="sm" className="rounded-full border-zinc-700 text-zinc-200 hover:bg-zinc-800">
                <FolderOpen className="mr-2 h-4 w-4" />
                📂 データ管理へ
              </Button>
            </Link>
          </div>
        </header>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* タブ */}
        <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
          <CardContent className="p-5">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
              <TabsList className="mb-4 grid h-auto grid-cols-5 gap-1 rounded-xl bg-zinc-900 p-1">
                <TabsTrigger
                  value="artist"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <User className="h-4 w-4" />
                  アーティスト
                  {artistRequestsCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-semibold text-white">
                      {artistRequestsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="song"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <Music className="h-4 w-4" />
                  楽曲
                  {songRequestsCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-semibold text-white">
                      {songRequestsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="mix"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <Headphones className="h-4 w-4" />
                  MIX
                  {mixRequestsCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-semibold text-white">
                      {mixRequestsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="inquiry"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <MessageSquare className="h-4 w-4" />
                  問い合わせ
                  {inquiryCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-semibold text-white">
                      {inquiryCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="bulletin"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <LayoutGrid className="h-4 w-4" />
                  掲示板
                  {bulletinCount > 0 && (
                    <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-semibold text-white">
                      {bulletinCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* アーティストタブ */}
              <TabsContent value="artist">
                {loading ? (
                  <div className="py-8 text-center text-sm text-zinc-500">読み込み中...</div>
                ) : requests.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-500">リクエストがありません</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ステータス</TableHead>
                          <TableHead>アーティスト名</TableHead>
                          <TableHead>読み方</TableHead>
                          <TableHead>X URL</TableHead>
                          <TableHead className="w-[180px]">作成日時</TableHead>
                          <TableHead className="w-[200px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((req) => (
                            <TableRow key={req.id}>
                              <TableCell>
                                <StatusBadge status={req.status} />
                              </TableCell>
                              <TableCell className="font-medium">{req.artist_name || "-"}</TableCell>
                              <TableCell className="text-sm text-zinc-400">
                                {req.artist_reading || "—"}
                              </TableCell>
                              <TableCell>
                                {req.artist_x_url ? (
                                  <a
                                    href={req.artist_x_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-400 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="text-xs">開く</span>
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-zinc-400">
                                {new Date(req.created_at).toLocaleString("ja-JP")}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-full text-xs"
                                    onClick={() => updateStatus(req.id, "approved")}
                                    disabled={saving || req.status === "approved"}
                                  >
                                    <Check className="mr-1 h-3 w-3" />
                                    承認
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 rounded-full text-xs"
                                    onClick={() => updateStatus(req.id, "rejected")}
                                    disabled={saving || req.status === "rejected"}
                                  >
                                    <X className="mr-1 h-3 w-3" />
                                    却下
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* 楽曲タブ */}
              <TabsContent value="song">
                {loading ? (
                  <div className="py-8 text-center text-sm text-zinc-500">読み込み中...</div>
                ) : filteredRequests.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-500">リクエストがありません</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ステータス</TableHead>
                          <TableHead>曲名</TableHead>
                          <TableHead>アーティスト</TableHead>
                          <TableHead>リンク</TableHead>
                          <TableHead className="w-[180px]">作成日時</TableHead>
                          <TableHead className="w-[200px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell>
                              <StatusBadge status={req.status} />
                            </TableCell>
                            <TableCell className="font-medium">{req.song_title || "-"}</TableCell>
                            <TableCell className="text-sm">{getArtistName(req.related_artist_id)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {req.youtube_url && (
                                  <a
                                    href={req.youtube_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    YouTube
                                  </a>
                                )}
                                {req.apple_music_url && (
                                  <a
                                    href={req.apple_music_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Apple Music
                                  </a>
                                )}
                                {!req.youtube_url && !req.apple_music_url && (
                                  <span className="text-xs text-zinc-500">なし</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-zinc-400">
                              {new Date(req.created_at).toLocaleString("ja-JP")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 rounded-full text-xs"
                                  onClick={() => updateStatus(req.id, "approved")}
                                  disabled={saving || req.status === "approved"}
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  承認
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 rounded-full text-xs"
                                  onClick={() => updateStatus(req.id, "rejected")}
                                  disabled={saving || req.status === "rejected"}
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  却下
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* MIXタブ */}
              <TabsContent value="mix">
                {loading ? (
                  <div className="py-8 text-center text-sm text-zinc-500">読み込み中...</div>
                ) : filteredRequests.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-500">リクエストがありません</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ステータス</TableHead>
                          <TableHead>タイトル</TableHead>
                          <TableHead>コール内容</TableHead>
                          <TableHead className="w-[80px]">小節数</TableHead>
                          <TableHead className="w-[120px]">備考</TableHead>
                          <TableHead className="w-[180px]">作成日時</TableHead>
                          <TableHead className="w-[250px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell>
                              <StatusBadge status={req.status} />
                            </TableCell>
                            <TableCell className="font-medium">{req.mix_title || "-"}</TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="line-clamp-2 text-xs text-zinc-300">
                                  {req.mix_content || "-"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {req.measures != null ? `${req.measures}小節` : req.mix_bars || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[120px]">
                                <p className="line-clamp-2 text-xs text-zinc-400">
                                  {req.remarks || "-"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-zinc-400">
                              {new Date(req.created_at).toLocaleString("ja-JP")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 rounded-full text-xs"
                                  onClick={() => {
                                    setSelectedMixContent(req.mix_content || "");
                                    setMixDetailDialogOpen(true);
                                  }}
                                >
                                  詳細
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 rounded-full text-xs"
                                  onClick={() => updateStatus(req.id, "approved")}
                                  disabled={saving || req.status === "approved"}
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  承認
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 rounded-full text-xs"
                                  onClick={() => updateStatus(req.id, "rejected")}
                                  disabled={saving || req.status === "rejected"}
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  却下
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* 問い合わせタブ */}
              <TabsContent value="inquiry">
                <div className="mb-4 flex gap-1 rounded-lg bg-zinc-900/80 p-1">
                  <button
                    type="button"
                    onClick={() => setFilterCategory("all")}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      filterCategory === "all"
                        ? "bg-zinc-50 text-black"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("request")}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      filterCategory === "request"
                        ? "bg-zinc-50 text-black"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    機能改善
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("other")}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      filterCategory === "other"
                        ? "bg-zinc-50 text-black"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    その他
                  </button>
                </div>
                {loading ? (
                  <div className="py-8 text-center text-sm text-zinc-500">読み込み中...</div>
                ) : filteredRequests.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-500">リクエストがありません</div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((req) => (
                      <Card key={req.id} className="rounded-xl border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={req.status} />
                              <Badge
                                variant="outline"
                                className="border-zinc-600 bg-zinc-800/80 text-zinc-300"
                              >
                                {req.category === "request" ? "機能改善" : "その他"}
                              </Badge>
                              <span className="text-xs text-zinc-500">
                                {new Date(req.created_at).toLocaleString("ja-JP")}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full text-xs"
                                onClick={() => updateStatus(req.id, "approved")}
                                disabled={saving || req.status === "approved"}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                承認
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 rounded-full text-xs"
                                onClick={() => updateStatus(req.id, "rejected")}
                                disabled={saving || req.status === "rejected"}
                              >
                                <X className="mr-1 h-3 w-3" />
                                却下
                              </Button>
                            </div>
                          </div>
                          <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                            <p className="mb-1 text-[10px] font-medium text-zinc-500">問い合わせ内容</p>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                              {req.content || "-"}
                            </p>
                          </div>
                          {(req.response ?? req.admin_reply) && (
                            <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                              <p className="mb-1 text-[10px] font-medium text-emerald-300">現在の返信</p>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-100">
                                {req.response ?? req.admin_reply}
                              </p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor={`reply-${req.id}`} className="text-xs font-medium text-zinc-400">
                              返信
                            </Label>
                            <Textarea
                              id={`reply-${req.id}`}
                              rows={4}
                              value={replyDraft[req.id] ?? req.response ?? req.admin_reply ?? ""}
                              onChange={(e) =>
                                setReplyDraft((prev) => ({ ...prev, [req.id]: e.target.value }))
                              }
                              placeholder="返信内容を入力..."
                              className="rounded-lg border-zinc-800 bg-zinc-900 text-sm"
                              disabled={savingRequestId !== null && savingRequestId !== req.id}
                            />
                            <Button
                              size="sm"
                              className="h-8 rounded-lg text-xs"
                              onClick={() => handleSaveReply(req.id)}
                              disabled={
                                savingRequestId !== null ||
                                !(replyDraft[req.id] ?? req.response ?? req.admin_reply ?? "").trim()
                              }
                            >
                              <Reply className="mr-1.5 h-3.5 w-3.5" />
                              {savingRequestId === req.id ? "保存中..." : "返信を保存"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 掲示板タブ（未承認の審査） */}
              <TabsContent value="bulletin" className="mt-0">
                {loading ? (
                  <div className="py-8 text-center text-sm text-zinc-500">読み込み中...</div>
                ) : bulletinPending.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-500">未承認の掲示板投稿はありません</div>
                ) : (
                  <div className="space-y-4">
                    {bulletinPending.map((post) => {
                      const imageUrls = getBoardImageUrls(post.images);
                      return (
                        <Card key={post.id} className="rounded-xl border-zinc-800 bg-zinc-900/50">
                          <CardContent className="p-4">
                            {imageUrls.length > 0 && (
                              <div className="mb-3 flex gap-1 overflow-x-auto">
                                {imageUrls.map((url, i) => (
                                  <img
                                    key={i}
                                    src={url}
                                    alt={`告知 ${i + 1}`}
                                    className="h-24 w-auto shrink-0 rounded-lg object-cover"
                                  />
                                ))}
                              </div>
                            )}
                            <p className="mb-2 font-semibold text-zinc-100">{post.group_name ?? "—"}</p>
                            <p className="mb-1 text-xs text-zinc-400">
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
                              <p className="mb-2 text-sm text-zinc-400">{post.live_title}</p>
                            )}
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                              <Badge
                                variant="outline"
                                className="border-zinc-600 bg-zinc-800/80 text-zinc-300"
                              >
                                {getBoardCategoryLabel(post.category)}
                              </Badge>
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(post.event_date).toLocaleDateString("ja-JP")}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {post.location}
                              </span>
                              {post.user_id && (
                                <span className="text-xs text-zinc-500">user: {post.user_id.slice(0, 8)}…</span>
                              )}
                            </div>
                            {post.description?.trim() && (
                              <p className="mb-3 whitespace-pre-wrap text-sm text-zinc-300">{post.description}</p>
                            )}
                            <p className="mb-3 text-xs text-zinc-500">主のX: {post.x_id || "—"}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-8 rounded-full text-xs"
                                onClick={() => handleApproveBulletin(post.id)}
                                disabled={saving}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                承認
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 rounded-full text-xs"
                                onClick={() => handleRejectBulletin(post.id)}
                                disabled={saving}
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                却下
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* MIX詳細ダイアログ */}
      <Dialog open={mixDetailDialogOpen} onOpenChange={setMixDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>MIX詳細</DialogTitle>
            <DialogDescription>コール内容の全文を表示します</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {selectedMixContent || "-"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 返信ダイアログ */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>返信を送信</DialogTitle>
            <DialogDescription>ユーザーへの返信内容を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reply-text" className="text-sm">
                返信内容
              </Label>
              <Textarea
                id="reply-text"
                rows={6}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="返信内容を入力..."
                className="rounded-xl border-zinc-800 bg-zinc-900 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyDialogOpen(false);
                setReplyingRequestId(null);
                setReplyText("");
              }}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={handleReply}
              disabled={saving || !replyText.trim()}
              className="inline-flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              {saving ? "送信中..." : "送信"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
