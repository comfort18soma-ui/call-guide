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
import { Edit, Twitter } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Artist = {
  id: string;
  name: string;
  reading: string | null;
  x_url: string | null;
};

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [readingInput, setReadingInput] = useState("");
  const [xUrlInput, setXUrlInput] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredArtists = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [artists, search]);

  const fetchArtists = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, reading, x_url")
        .order("name", { ascending: true });

      if (error) throw error;
      setArtists((data as Artist[]) ?? []);
    } catch (err: any) {
      setError(err?.message ?? "アーティスト一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchArtists();
  }, []);

  const resetForm = () => {
    setEditingArtist(null);
    setNameInput("");
    setReadingInput("");
    setXUrlInput("");
  };

  const handleOpenNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setNameInput(artist.name);
    setReadingInput(artist.reading ?? "");
    setXUrlInput(artist.x_url ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    setError(null);

    try {
      if (editingArtist) {
        const { error } = await supabase
          .from("artists")
          .update({
            name: nameInput.trim(),
            reading: readingInput.trim() || null,
            x_url: xUrlInput.trim() || null,
          })
          .eq("id", editingArtist.id);
        if (error) throw error;
      } else {
        const { error: insertError } = await supabase
          .from("artists")
          .insert({
            name: nameInput.trim(),
            reading: readingInput.trim() || null,
            x_url: xUrlInput.trim() || null,
          })
          .select("id")
          .single();
        if (insertError) throw insertError;
      }

      setDialogOpen(false);
      resetForm();
      await fetchArtists();
    } catch (err: any) {
      setError(err?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-zinc-50 md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Admin / アーティスト管理</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              アーティスト管理
            </h1>
            <p className="text-sm text-zinc-400">
              アーティスト情報の一覧、検索、新規追加と編集を行います。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="名前で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-40 md:w-60"
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
                    {editingArtist
                      ? "アーティストを編集"
                      : "新規アーティストの追加"}
                  </DialogTitle>
                  <DialogDescription>
                    名前、ヘッダー画像、Twitter URL を設定して保存します。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="artist-name">名前</Label>
                    <Input
                      id="artist-name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="アーティスト名"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="artist-reading">読み方（カタカナ）</Label>
                    <Input
                      id="artist-reading"
                      value={readingInput}
                      onChange={(e) => setReadingInput(e.target.value)}
                      placeholder="例: アーティストメイ"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="artist-x-url">X (Twitter) URL</Label>
                    <Input
                      id="artist-x-url"
                      value={xUrlInput}
                      onChange={(e) => setXUrlInput(e.target.value)}
                      placeholder="https://x.com/..."
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
                    disabled={saving || !nameInput.trim()}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>読み方</TableHead>
                  <TableHead>X URL</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-xs text-zinc-500"
                    >
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : filteredArtists.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-xs text-zinc-500"
                    >
                      アーティストが見つかりません。
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArtists.map((artist) => (
                    <TableRow key={artist.id}>
                      <TableCell className="truncate text-[11px] text-zinc-500">
                        {artist.id}
                      </TableCell>
                      <TableCell>{artist.name}</TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {artist.reading || "—"}
                      </TableCell>
                      <TableCell>
                        {artist.x_url ? (
                          <a
                            href={artist.x_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
                          >
                            <Twitter className="h-3 w-3" />
                            <span className="hidden md:inline">
                              プロフィール
                            </span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-500">
                            なし
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1 text-[11px]"
                          onClick={() => handleOpenEdit(artist)}
                        >
                          <Edit className="h-3 w-3" />
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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

