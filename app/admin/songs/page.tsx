"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Music, Youtube } from "lucide-react";
import { convertAmazonLink } from "@/lib/affiliate";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ArtistOption = {
  id: number;
  name: string;
};

type SongRow = {
  id: number;
  title: string;
  youtube_url: string | null;
  apple_music_url: string | null;
  artist_id: number;
  artist_name: string;
};

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongRow | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [artistIdInput, setArtistIdInput] = useState<string>("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [appleMusicInput, setAppleMusicInput] = useState("");
  const [amazonMusicInput, setAmazonMusicInput] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist_name.toLowerCase().includes(q)
    );
  }, [songs, search]);

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      setArtists((data as ArtistOption[]) ?? []);
    } catch (err) {
      console.error("Failed to load artists", err);
    }
  };

  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("songs")
        .select(
          "id, title, youtube_url, apple_music_url, amazon_music_url, artist_id, artists ( id, name )"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped: SongRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        youtube_url: row.youtube_url,
        apple_music_url: row.apple_music_url,
        amazon_music_url: row.amazon_music_url,
        artist_id: row.artist_id as number,
        artist_name: row.artists?.name ?? "",
      }));
      setSongs(mapped);
    } catch (err: any) {
      setError(err?.message ?? "楽曲一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchArtists();
    void fetchSongs();
  }, []);

  const resetForm = () => {
    setEditingSong(null);
    setTitleInput("");
    setArtistIdInput("");
    setYoutubeInput("");
    setAppleMusicInput("");
    setAmazonMusicInput("");
  };

  const handleOpenNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (song: SongRow) => {
    setEditingSong(song);
    setTitleInput(song.title);
    setArtistIdInput(String(song.artist_id));
    setYoutubeInput(song.youtube_url ?? "");
    setAppleMusicInput(song.apple_music_url ?? "");
    setAmazonMusicInput((song as any).amazon_music_url ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!titleInput.trim() || !artistIdInput) return;
    setSaving(true);
    setError(null);

    try {
      const artistIdNumber = Number(artistIdInput);

      const amazonUrl = (convertAmazonLink(amazonMusicInput.trim()) ?? amazonMusicInput.trim()) || null;

      if (editingSong) {
        const { error } = await supabase
          .from("songs")
          .update({
            title: titleInput.trim(),
            artist_id: artistIdNumber,
            youtube_url: youtubeInput.trim() || null,
            apple_music_url: appleMusicInput.trim() || null,
            amazon_music_url: amazonUrl,
          })
          .eq("id", editingSong.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("songs").insert({
          title: titleInput.trim(),
          artist_id: artistIdNumber,
          youtube_url: youtubeInput.trim() || null,
          apple_music_url: appleMusicInput.trim() || null,
          amazon_music_url: amazonUrl,
        });
        if (error) throw error;
      }

      setDialogOpen(false);
      resetForm();
      await fetchSongs();
    } catch (err: any) {
      setError(err?.message ?? "楽曲の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-zinc-50 md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Admin / 楽曲管理</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              楽曲管理
            </h1>
            <p className="text-sm text-zinc-400">
              楽曲情報の一覧、検索、新規追加と編集、コール表の編集を行います。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="曲名・アーティスト名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-48 md:w-72"
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="whitespace-nowrap"
                  type="button"
                  onClick={handleOpenNew}
                >
                  新規追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSong ? "楽曲を編集" : "新規楽曲の追加"}
                  </DialogTitle>
                  <DialogDescription>
                    タイトル、アーティスト、配信リンクを設定して保存します。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="song-title">タイトル</Label>
                    <Input
                      id="song-title"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="楽曲タイトル"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>アーティスト</Label>
                    <Select
                      value={artistIdInput}
                      onValueChange={setArtistIdInput}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="アーティストを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {artists.map((artist) => (
                          <SelectItem key={artist.id} value={String(artist.id)}>
                            {artist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="song-youtube">YouTube URL</Label>
                    <Input
                      id="song-youtube"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      placeholder="https://www.youtube.com/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="song-apple">Apple Music URL</Label>
                    <Input
                      id="song-apple"
                      value={appleMusicInput}
                      onChange={(e) => setAppleMusicInput(e.target.value)}
                      placeholder="https://music.apple.com/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="song-amazon">Amazon Music URL</Label>
                    <Input
                      id="song-amazon"
                      value={amazonMusicInput}
                      onChange={(e) => setAmazonMusicInput(e.target.value)}
                      placeholder="https://music.amazon.co.jp/..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(false)}
                    disabled={saving}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !titleInput.trim() || !artistIdInput}
                  >
                    {saving ? "保存中..." : "保存"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {error && (
          <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>曲名</TableHead>
                <TableHead>アーティスト</TableHead>
                <TableHead>リンク</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : filteredSongs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs">
                    楽曲が見つかりません。
                  </TableCell>
                </TableRow>
              ) : (
                filteredSongs.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell>{song.title}</TableCell>
                    <TableCell>{song.artist_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {song.youtube_url ? (
                          <a
                            href={song.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-red-400 hover:text-red-300"
                          >
                            <Youtube className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-500">
                            YTなし
                          </span>
                        )}
                        {song.apple_music_url ? (
                          <a
                            href={song.apple_music_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-emerald-400 hover:text-emerald-300"
                          >
                            <Music className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-500">
                            AMなし
                          </span>
                        )}
                        {(song as any).amazon_music_url ? (
                          <a
                            href={(song as any).amazon_music_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-cyan-400 hover:text-cyan-300"
                          >
                            <Music className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-500">
                            Azなし
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1 text-[11px]"
                          onClick={() => handleOpenEdit(song)}
                        >
                          <Edit className="h-3 w-3" />
                          編集
                        </Button>
                        <Link href={`/admin/songs/${song.id}`}>
                          <Button
                            type="button"
                            size="sm"
                            className="inline-flex items-center gap-1 text-[11px]"
                          >
                            コール表を作成
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <footer className="flex items-center justify-between text-[11px] text-zinc-500">
          <Link
            href="/admin"
            className="underline underline-offset-4 hover:text-zinc-300"
          >
            管理ダッシュボードに戻る
          </Link>
        </footer>
      </div>
    </main>
  );
}

