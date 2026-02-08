"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { convertAmazonLink, convertAppleMusicLink } from "@/lib/affiliate";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type EditSongModalSong = {
  id: number;
  title: string;
  youtube_url: string | null;
  apple_music_url: string | null;
  amazon_music_url: string | null;
};

type EditSongModalProps = {
  song: EditSongModalSong | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function EditSongModal({
  song,
  open,
  onOpenChange,
  onSaved,
}: EditSongModalProps) {
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [appleMusicUrl, setAppleMusicUrl] = useState("");
  const [amazonMusicUrl, setAmazonMusicUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!song || !open) return;
    setTitle(song.title ?? "");
    setYoutubeUrl(song.youtube_url ?? "");
    setAppleMusicUrl(song.apple_music_url ?? "");
    setAmazonMusicUrl(song.amazon_music_url ?? "");
    setError(null);
  }, [song, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song) return;
    setSaving(true);
    setError(null);
    try {
      const amazonUrl =
        (convertAmazonLink(amazonMusicUrl.trim()) ?? amazonMusicUrl.trim()) || null;
      const appleUrl =
        (convertAppleMusicLink(appleMusicUrl.trim()) ?? appleMusicUrl.trim()) || null;

      const { error: updateError } = await supabase
        .from("songs")
        .update({
          title: title.trim(),
          youtube_url: youtubeUrl.trim() || null,
          apple_music_url: appleUrl,
          amazon_music_url: amazonUrl,
        })
        .eq("id", song.id);

      if (updateError) throw updateError;
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "保存に失敗しました"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">楽曲を編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-song-title" className="text-zinc-300">
              タイトル
            </Label>
            <Input
              id="edit-song-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-youtube" className="text-zinc-300">
              YouTube URL
            </Label>
            <Input
              id="edit-youtube"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-apple" className="text-zinc-300">
              Apple Music URL
            </Label>
            <Input
              id="edit-apple"
              type="url"
              value={appleMusicUrl}
              onChange={(e) => setAppleMusicUrl(e.target.value)}
              placeholder="https://music.apple.com/..."
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-amazon" className="text-zinc-300">
              Amazon Music URL
            </Label>
            <Input
              id="edit-amazon"
              type="url"
              value={amazonMusicUrl}
              onChange={(e) => setAmazonMusicUrl(e.target.value)}
              placeholder="https://music.amazon.co.jp/..."
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              disabled={saving}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-zinc-700"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
