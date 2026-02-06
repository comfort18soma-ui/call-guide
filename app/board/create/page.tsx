"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ChevronLeft, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOARD_CATEGORIES, type BoardCategoryValue } from "@/lib/board-categories";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MAX_IMAGES = 2;

export default function BoardCreatePage() {
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [category, setCategory] = useState<BoardCategoryValue | "">("");
  const [groupName, setGroupName] = useState("");
  const [liveTitle, setLiveTitle] = useState("");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");
  const [hostXId, setHostXId] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setAuthChecked(true);
    };
    void checkSession();
  }, [router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.type.startsWith("image/"));
    setImageFiles((prev) => {
      const next = [...prev, ...valid].slice(0, MAX_IMAGES);
      return next;
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 時刻必須チェック（時・分の両方）
    if (!hour || !minute) {
      alert("時間を入力してください");
      return;
    }

    const eventTime = `${hour}:${minute}`;

    if (!eventDate.trim() || !category || !groupName.trim() || !place.trim()) {
      setError("日付・時間・ジャンル・グループ名・場所は必須です");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const imagePaths: string[] = [];
      if (imageFiles.length > 0) {
        const prefix = `board/${user?.id ?? "anon"}/${Date.now()}`;
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${prefix}-${i}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("board-uploads")
            .upload(path, file, { upsert: false });
          if (uploadError) throw uploadError;
          imagePaths.push(path);
        }
      }

      const { error: insertError } = await supabase.from("bulletin_boards").insert({
        event_date: eventDate.trim(),
        event_time: eventTime,
        category: category as BoardCategoryValue,
        group_name: groupName.trim(),
        live_title: liveTitle.trim() || null,
        location: place.trim(),
        description: notes.trim() || null,
        x_id: hostXId.trim(),
        images: imagePaths.length > 0 ? imagePaths : null,
        user_id: user?.id ?? null,
        status: "pending",
      });

      if (insertError) throw insertError;
      router.push("/board");
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-rose-950/30 via-black to-fuchsia-950/20 pb-24 text-zinc-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-950/30 via-black to-fuchsia-950/20 pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <Link
            href="/board"
            className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
          >
            <ChevronLeft className="h-5 w-5" />
            掲示板に戻る
          </Link>
          <h1 className="text-xl font-bold tracking-tight">募集を投稿</h1>
          <p className="mt-2 text-sm text-zinc-400">
            日付・場所・詳細を入力して告知
          </p>
        </header>

        <Card className="overflow-hidden rounded-2xl border-rose-500/20 bg-zinc-900/80">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="event-date" className="text-zinc-300">
                  日付 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">
                  時間  <span className="text-red-400">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Select value={hour} onValueChange={setHour} disabled={submitting}>
                    <SelectTrigger className="w-[100px] rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100">
                      <SelectValue placeholder="時" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                          {i.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-zinc-400">:</span>
                  <Select value={minute} onValueChange={setMinute} disabled={submitting}>
                    <SelectTrigger className="w-[100px] rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100">
                      <SelectValue placeholder="分" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-zinc-300">
                  ジャンル <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as BoardCategoryValue)}
                  required
                  disabled={submitting}
                >
                  <SelectTrigger
                    id="category"
                    className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                  >
                    <SelectValue placeholder="ジャンルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOARD_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-name" className="text-zinc-300">
                  グループ名 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="group-name"
                  placeholder="例: 〇〇組"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="live-title" className="text-zinc-300">
                  ライブタイトル（任意）
                </Label>
                <Input
                  id="live-title"
                  placeholder="例: 〇〇 1st LIVE"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place" className="text-zinc-300">
                  場所 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="place"
                  placeholder="例: 〇〇ホール"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-zinc-300">
                  備考
                </Label>
                <Textarea
                  id="notes"
                  placeholder="目標人数や条件など"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="host-x" className="text-zinc-300">
                  主のX/ポスト等
                </Label>
                <Input
                  id="host-x"
                  placeholder="@username または https://x.com/..."
                  value={hostXId}
                  onChange={(e) => setHostXId(e.target.value)}
                  className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">告知画像（最大2枚）</Label>
                <div className="flex flex-wrap gap-2">
                  {imageFiles.map((file, i) => (
                    <div
                      key={i}
                      className="relative inline-block rounded-xl border border-zinc-700 bg-zinc-900 p-1"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`プレビュー ${i + 1}`}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                        aria-label="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < MAX_IMAGES && (
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-900/50 text-zinc-500 hover:border-rose-500/50 hover:text-rose-400">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onFileChange}
                        disabled={submitting}
                      />
                      <ImagePlus className="h-8 w-8" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 rounded-xl bg-rose-500 hover:bg-rose-400"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      投稿中...
                    </>
                  ) : (
                    "投稿する"
                  )}
                </Button>
                <Link href="/board">
                  <Button type="button" variant="outline" className="rounded-xl border-zinc-600">
                    キャンセル
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
