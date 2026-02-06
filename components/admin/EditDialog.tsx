"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type EditKind = "artist" | "song" | "mix";

export type ArtistRow = {
  id: string;
  name: string;
  reading: string | null;
  x_url: string | null;
};

export type SongRow = {
  id: number;
  title: string;
  youtube_url: string | null;
  apple_music_url: string | null;
  artist_id?: number;
  artist_name?: string;
};

export type MixRow = {
  id: string;
  title: string;
  content: string;
  bars: number | null;
  url: string | null;
};

type EditData = ArtistRow | SongRow | MixRow;

type EditDialogProps = {
  kind: EditKind;
  data: EditData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function EditDialog({ kind, data, open, onOpenChange, onSaved }: EditDialogProps) {
  const supabase = useMemo(
    () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Artist
  const [name, setName] = useState("");
  const [reading, setReading] = useState("");
  const [xUrl, setXUrl] = useState("");

  // Song
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [appleMusicUrl, setAppleMusicUrl] = useState("");

  // Mix
  const [mixTitle, setMixTitle] = useState("");
  const [content, setContent] = useState("");
  const [barCount, setBarCount] = useState<string>("");
  const [mixUrl, setMixUrl] = useState("");

  useEffect(() => {
    if (!data || !open) return;
    setError(null);
    if (kind === "artist") {
      const a = data as ArtistRow;
      setName(a.name);
      setReading(a.reading ?? "");
      setXUrl(a.x_url ?? "");
    }
    if (kind === "song") {
      const s = data as SongRow;
      setTitle(s.title);
      setYoutubeUrl(s.youtube_url ?? "");
      setAppleMusicUrl(s.apple_music_url ?? "");
    }
    if (kind === "mix") {
      const m = data as MixRow;
      setMixTitle(m.name);
      setContent(m.content);
      setBarCount(m.bars != null ? String(m.bars) : "");
      setMixUrl(m.url ?? "");
    }
  }, [kind, data, open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (kind === "artist") {
        const a = data as ArtistRow;
        const { error: e } = await supabase
          .from("artists")
          .update({
            name: name.trim(),
            reading: reading.trim() || null,
            x_url: xUrl.trim() || null,
          })
          .eq("id", a.id);
        if (e) throw e;
      }
      if (kind === "song") {
        const s = data as SongRow;
        const { error: e } = await supabase
          .from("songs")
          .update({
            title: title.trim(),
            youtube_url: youtubeUrl.trim() || null,
            apple_music_url: appleMusicUrl.trim() || null,
          })
          .eq("id", s.id);
        if (e) throw e;
      }
      if (kind === "mix") {
        const m = data as MixRow;
        const barCountNum = barCount.trim() === "" ? null : parseInt(barCount, 10);
        const { error: e } = await supabase
          .from("mixes")
          .update({
            title: mixTitle.trim(),
            content: content.trim(),
            bars: barCountNum,
            url: mixUrl.trim() || null,
          })
          .eq("id", m.id);
        if (e) throw e;
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存に失敗しました";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const titleLabel = kind === "artist" ? "アーティスト編集" : kind === "song" ? "楽曲編集" : "Mix編集";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{titleLabel}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            項目を変更して保存してください。
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {kind === "artist" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-zinc-300">名前</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reading" className="text-zinc-300">読み方 (カタカナ)</Label>
              <Input
                id="edit-reading"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="アーティストメイ"
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-x-url" className="text-zinc-300">X URL</Label>
              <Input
                id="edit-x-url"
                type="url"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/..."
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
          </div>
        )}

        {kind === "song" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-zinc-300">タイトル</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-youtube" className="text-zinc-300">YouTube URL</Label>
              <Input
                id="edit-youtube"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/..."
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-apple" className="text-zinc-300">Apple Music URL</Label>
              <Input
                id="edit-apple"
                type="url"
                value={appleMusicUrl}
                onChange={(e) => setAppleMusicUrl(e.target.value)}
                placeholder="https://music.apple.com/..."
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
          </div>
        )}

        {kind === "mix" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-mix-title" className="text-zinc-300">タイトル</Label>
              <Input
                id="edit-mix-title"
                value={mixTitle}
                onChange={(e) => setMixTitle(e.target.value)}
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-zinc-300">本文</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bar-count" className="text-zinc-300">小節数（任意）</Label>
              <Input
                id="edit-bar-count"
                type="number"
                min={0}
                value={barCount}
                onChange={(e) => setBarCount(e.target.value)}
                placeholder="例: 8"
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mix-url" className="text-zinc-300">参考URL</Label>
              <Input
                id="edit-mix-url"
                type="url"
                value={mixUrl}
                onChange={(e) => setMixUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-xl border-zinc-800 bg-zinc-900"
                disabled={saving}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-zinc-700"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full"
          >
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
