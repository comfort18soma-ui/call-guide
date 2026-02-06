"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditDialog, type EditKind, type ArtistRow, type SongRow, type MixRow } from "@/components/admin/EditDialog";
import { User, Music, Headphones, MessageSquare, LayoutGrid, Pencil, Trash2, ArrowLeft, ExternalLink, Calendar, MapPin } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Artist = {
  id: string;
  name: string;
  reading: string | null;
  x_url: string | null;
};

type Song = {
  id: number;
  title: string;
  youtube_url: string | null;
  apple_music_url: string | null;
  artist_id: number;
  artist_name: string;
};

type Mix = {
  id: string;
  title: string;
  content: string;
  bars: number | null;
  url: string | null;
  author_id?: string | null;
  author_name?: string | null;
  profiles?: { username: string | null; handle: string | null } | null;
};

type InquiryRow = {
  id: string;
  content: string | null;
  response: string | null;
  category: string | null;
  created_at: string;
};

type BulletinRow = {
  id: string;
  event_date: string;
  location: string;
  description: string | null;
  x_id: string | null;
  images: string[] | null;
  user_id: string | null;
  created_at: string;
  category: string | null;
  group_name: string | null;
  live_title: string | null;
  profiles?: { username: string | null; handle: string | null } | null;
};

type InquiryFilterTab = "all" | "request" | "other";

// カテゴリIDを日本語ラベルに変換する関数
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

export default function AdminManagePage() {
  const [activeTab, setActiveTab] = useState<"artists" | "songs" | "mixes" | "inquiries" | "bulletin">("artists");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [bulletinApproved, setBulletinApproved] = useState<BulletinRow[]>([]);
  const [inquiryFilterTab, setInquiryFilterTab] = useState<InquiryFilterTab>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editKind, setEditKind] = useState<EditKind | null>(null);
  const [editData, setEditData] = useState<ArtistRow | SongRow | MixRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadArtists = async () => {
    setError(null);
    const { data, error: e } = await supabase
      .from("artists")
      .select("id, name, reading, x_url")
      .order("name", { ascending: true });
    if (e) {
      console.error("🔥 Supabase Fetch Error (artists):", JSON.stringify(e, null, 2));
      console.error(e.message);
      throw e;
    }
    setArtists((data as Artist[]) ?? []);
  };

  const loadSongs = async () => {
    setError(null);
    const { data, error: e } = await supabase
      .from("songs")
      .select("id, title, youtube_url, apple_music_url, amazon_music_url, artist_id, artists(id, name)")
      .order("title", { ascending: true });
    if (e) {
      console.error("🔥 Supabase Fetch Error (songs):", JSON.stringify(e, null, 2));
      console.error(e.message);
      throw e;
    }
    const mapped: Song[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as number,
      title: row.title as string,
      youtube_url: (row.youtube_url as string | null) ?? null,
      apple_music_url: (row.apple_music_url as string | null) ?? null,
      artist_id: row.artist_id as number,
      artist_name: (row.artists as { name?: string } | null)?.name ?? "",
    }));
    setSongs(mapped);
  };

  const loadMixes = async () => {
    setError(null);
    const { data, error: e } = await supabase
      .from("mixes")
      .select(`
        id,
        title,
        content,
        bars,
        url,
        author_id,
        song_id,
        profiles!mixes_author_id_fkey ( username ),
        songs(id, title, artist_id, artists(name))
      `)
      .order("created_at", { ascending: false });
    if (e) {
      console.error("🔥 Supabase Fetch Error (mixes):", JSON.stringify(e, null, 2));
      console.error(e.message);
      throw e;
    }
    const rows = (data ?? []) as Array<{
      id: string;
      title: string;
      content: string;
      bars: number | null;
      url: string | null;
      author_id?: string | null;
      song_id?: number | null;
      profiles?: { username: string | null } | null;
      songs?: { id?: number; title?: string; artist_id?: string; artists?: { name?: string } | null } | null;
    }>;
    setMixes(rows.map((r) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const authorName = profile?.username ?? null;
      return {
        id: r.id,
        title: r.title,
        content: r.content,
        bars: r.bars,
        url: r.url,
        author_id: r.author_id,
        author_name: authorName,
        profiles: r.profiles,
      };
    }));
  };

  const loadInquiries = async () => {
    setError(null);
    const { data, error: e } = await supabase
      .from("replies")
      .select("id, content, response, category, created_at")
      .order("created_at", { ascending: false });
    if (e) {
      console.error("🔥 Supabase Fetch Error (inquiries):", JSON.stringify(e, null, 2));
      console.error(e.message);
      throw e;
    }
    setInquiries((data as InquiryRow[]) ?? []);
  };

  const loadBulletinApproved = async () => {
    setError(null);
    const { data, error: e } = await supabase
      .from("bulletin_boards")
      .select("id, event_date, location, description, x_id, images, user_id, created_at, status, category, group_name, live_title, profiles(username, handle)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (e) {
      console.error("🔥 Supabase Fetch Error (bulletin):", JSON.stringify(e, null, 2));
      throw e;
    }
    setBulletinApproved((data as BulletinRow[]) ?? []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadArtists(), loadSongs(), loadMixes(), loadInquiries(), loadBulletinApproved()]);
    } catch (err) {
      console.error("🔥 Supabase Fetch Error Details:", JSON.stringify(err, null, 2));
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleEdit = (kind: EditKind, row: ArtistRow | SongRow | MixRow) => {
    setEditKind(kind);
    setEditData(row);
    setEditOpen(true);
  };

  const handleDeleteArtist = async (id: string) => {
    if (!window.confirm("このアーティストを削除しますか？")) return;
    try {
      const { error: e } = await supabase.from("artists").delete().eq("id", id);
      if (e) throw e;
      await loadArtists();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const handleDeleteSong = async (id: number) => {
    if (!window.confirm("この楽曲を削除しますか？")) return;
    try {
      const { error: e } = await supabase.from("songs").delete().eq("id", id);
      if (e) throw e;
      await loadSongs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const handleDeleteMix = async (id: string) => {
    if (!window.confirm("このMixを削除しますか？")) return;
    try {
      const { error: e } = await supabase.from("mixes").delete().eq("id", id);
      if (e) throw e;
      await loadMixes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm("この回答履歴を削除しますか？")) return;
    try {
      const { error: e } = await supabase.from("replies").delete().eq("id", id);
      if (e) throw e;
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      alert("削除しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const handleDeleteBulletin = async (id: string) => {
    if (!window.confirm("この掲示板投稿を削除（公開停止）しますか？")) return;
    try {
      const { error: e } = await supabase.from("bulletin_boards").delete().eq("id", id);
      if (e) throw e;
      setBulletinApproved((prev) => prev.filter((p) => p.id !== id));
      alert("削除しました");
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const getBoardImageUrls = (paths: string[] | null): string[] => {
    if (!paths?.length) return [];
    return paths.map((p) => supabase.storage.from("board-uploads").getPublicUrl(p).data.publicUrl);
  };

  const filteredInquiries = useMemo(() => {
    if (inquiryFilterTab === "all") return inquiries;
    return inquiries.filter((row) => (row.category ?? "other") === inquiryFilterTab);
  }, [inquiries, inquiryFilterTab]);

  const onEditSaved = () => {
    if (editKind === "artist") void loadArtists();
    if (editKind === "song") void loadSongs();
    if (editKind === "mix") void loadMixes();
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/requests">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  戻る
                </Button>
              </Link>
              <Link href="/admin/calls">
                <Button variant="outline" size="sm" className="rounded-full border-zinc-700 text-zinc-200 hover:bg-zinc-800">
                  📋 コール表リクエスト管理
                </Button>
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">データ管理</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Artists / Songs / Mixes / 問い合わせ の閲覧・編集・削除
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
          <CardContent className="p-5">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "artists" | "songs" | "mixes" | "inquiries" | "bulletin")}>
              <TabsList className="mb-4 grid h-auto grid-cols-5 gap-1 rounded-xl bg-zinc-900 p-1">
                <TabsTrigger
                  value="artists"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <User className="h-4 w-4" />
                  Artists
                </TabsTrigger>
                <TabsTrigger
                  value="songs"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <Music className="h-4 w-4" />
                  Songs
                </TabsTrigger>
                <TabsTrigger
                  value="mixes"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <Headphones className="h-4 w-4" />
                  Mixes
                </TabsTrigger>
                <TabsTrigger
                  value="inquiries"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <MessageSquare className="h-4 w-4" />
                  問い合わせ
                </TabsTrigger>
                <TabsTrigger
                  value="bulletin"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <LayoutGrid className="h-4 w-4" />
                  掲示板
                </TabsTrigger>
              </TabsList>

              <TabsContent value="artists" className="mt-0">
                {loading ? (
                  <p className="py-8 text-center text-sm text-zinc-500">読み込み中...</p>
                ) : artists.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">アーティストがありません</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>名前</TableHead>
                          <TableHead>X URL</TableHead>
                          <TableHead className="w-[140px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {artists.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {a.reading ? `${a.name} (${a.reading})` : a.name}
                            </TableCell>
                            <TableCell className="max-w-[120px] truncate text-xs text-zinc-500">
                              {a.x_url || "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full text-xs"
                                  onClick={() => handleEdit("artist", a)}
                                >
                                  <Pencil className="mr-1 h-3 w-3" />
                                  編集
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 rounded-full text-xs"
                                  onClick={() => handleDeleteArtist(a.id)}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  削除
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

              <TabsContent value="songs" className="mt-0">
                {loading ? (
                  <p className="py-8 text-center text-sm text-zinc-500">読み込み中...</p>
                ) : songs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">楽曲がありません</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>タイトル</TableHead>
                          <TableHead>アーティスト</TableHead>
                          <TableHead>YouTube</TableHead>
                          <TableHead>Apple Music</TableHead>
                          <TableHead className="w-[140px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {songs.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.title}</TableCell>
                            <TableCell className="text-sm text-zinc-400">{s.artist_name || "—"}</TableCell>
                            <TableCell className="max-w-[100px] truncate text-xs text-zinc-500">
                              {s.youtube_url ? "あり" : "—"}
                            </TableCell>
                            <TableCell className="max-w-[100px] truncate text-xs text-zinc-500">
                              {s.apple_music_url ? "あり" : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full text-xs"
                                  onClick={() => handleEdit("song", s)}
                                >
                                  <Pencil className="mr-1 h-3 w-3" />
                                  編集
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 rounded-full text-xs"
                                  onClick={() => handleDeleteSong(s.id)}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  削除
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

              <TabsContent value="inquiries" className="mt-0">
                <div className="mb-4 flex gap-1 rounded-lg bg-zinc-900/80 p-1">
                  <button
                    type="button"
                    onClick={() => setInquiryFilterTab("all")}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      inquiryFilterTab === "all"
                        ? "bg-zinc-50 text-black"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryFilterTab("request")}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      inquiryFilterTab === "request"
                        ? "bg-zinc-50 text-black"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    機能改善
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryFilterTab("other")}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      inquiryFilterTab === "other"
                        ? "bg-zinc-50 text-black"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    その他
                  </button>
                </div>
                {loading ? (
                  <p className="py-8 text-center text-sm text-zinc-500">読み込み中...</p>
                ) : filteredInquiries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    {inquiries.length === 0 ? "回答履歴がありません" : "このカテゴリには回答がありません"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredInquiries.map((row) => (
                      <Card key={row.id} className="rounded-xl border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-zinc-500">
                              {new Date(row.created_at).toLocaleString("ja-JP")}
                            </span>
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                              {row.category === "request" ? "機能改善" : row.category === "other" ? "その他" : "—"}
                            </span>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                            <p className="mb-1 text-[10px] font-medium text-zinc-500">ユーザーの質問</p>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                              {row.content || "—"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                            <p className="mb-1 text-[10px] font-medium text-emerald-300">運営の返信</p>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-100">
                              {row.response || "—"}
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 rounded-full text-xs"
                              onClick={() => handleDeleteInquiry(row.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              削除
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bulletin" className="mt-0">
                {loading ? (
                  <p className="py-8 text-center text-sm text-zinc-500">読み込み中...</p>
                ) : bulletinApproved.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">公開中の掲示板投稿はありません</p>
                ) : (
                  <div className="space-y-4">
                    {bulletinApproved.map((post) => {
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
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 rounded-full text-xs"
                                onClick={() => handleDeleteBulletin(post.id)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                削除
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mixes" className="mt-0">
                {loading ? (
                  <p className="py-8 text-center text-sm text-zinc-500">読み込み中...</p>
                ) : mixes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">Mixがありません</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>タイトル</TableHead>
                          <TableHead>作成者</TableHead>
                          <TableHead>小節数</TableHead>
                          <TableHead>参考URL</TableHead>
                          <TableHead className="max-w-[200px]">本文（抜粋）</TableHead>
                          <TableHead className="w-[140px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mixes.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.title}</TableCell>
                            <TableCell className="text-sm text-zinc-400">
                              {m.author_name || "名無し"}
                            </TableCell>
                            <TableCell className="text-sm text-zinc-400">
                              {m.bars != null ? `${m.bars}小節` : "—"}
                            </TableCell>
                            <TableCell>
                              {m.url ? (
                                <a
                                  href={m.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-zinc-500">
                              {m.content.slice(0, 40)}…
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-full text-xs"
                                  onClick={() => handleEdit("mix", m)}
                                >
                                  <Pencil className="mr-1 h-3 w-3" />
                                  編集
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 rounded-full text-xs"
                                  onClick={() => handleDeleteMix(m.id)}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  削除
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
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {editKind && (
        <EditDialog
          kind={editKind}
          data={editData}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={onEditSaved}
        />
      )}
    </main>
  );
}
