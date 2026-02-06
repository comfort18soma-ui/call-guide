"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Send, User, Music, Headphones, MessageSquare } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type RequestType = "artist" | "song" | "mix" | "inquiry";

type RequestInsert = {
  type: RequestType;
  user_id?: string | null;
  status?: string;
  artist_name?: string | null;
  artist_reading?: string | null;
  artist_x_url?: string | null;
  artist_image_path?: string | null;
  song_title?: string | null;
  related_artist_id?: string | null;
  youtube_url?: string | null;
  apple_music_url?: string | null;
  amazon_music_url?: string | null;
  mix_title?: string | null;
  mix_content?: string | null;
  mix_bars?: string | null;
  measures?: number | null;
  reference_url?: string | null;
  remarks?: string | null;
  content?: string | null;
  category?: string | null;
};

export default function RequestsPage() {
  const router = useRouter();

  // アーティストタブの状態
  const [artistName, setArtistName] = useState("");
  const [artistReading, setArtistReading] = useState("");
  const [artistXUrl, setArtistXUrl] = useState("");

  // 楽曲タブの状態
  const [selectedArtistId, setSelectedArtistId] = useState<string>("");
  const [artistOptions, setArtistOptions] = useState<ComboboxOption[]>([]);
  const [songTitle, setSongTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [appleMusicUrl, setAppleMusicUrl] = useState("");
  const [amazonMusicUrl, setAmazonMusicUrl] = useState("");

  // MIXタブの状態
  const [mixTitle, setMixTitle] = useState("");
  const [mixContent, setMixContent] = useState("");
  const [mixMeasures, setMixMeasures] = useState<string>("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [mixRemarks, setMixRemarks] = useState("");

  // 問い合わせタブの状態
  const [category, setCategory] = useState<"request" | "other">("request");
  const [inquiryContent, setInquiryContent] = useState("");

  const [submitting, setSubmitting] = useState<RequestType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showSuccessToast = () => {
    setToastMessage("リクエストを送信しました。運営が確認後に反映されます。");
    setTimeout(() => setToastMessage(null), 4000);
  };

  // アーティスト一覧を取得
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("artists")
          .select("id, name, reading")
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;

        const options: ComboboxOption[] = (data ?? []).map(
          (artist: { id: string; name: string; reading?: string | null }) => ({
            value: String(artist.id),
            label: artist.name,
            searchText: [artist.name, artist.reading].filter(Boolean).join(" "),
          })
        );

        setArtistOptions(options);
      } catch (err) {
        console.error("Failed to load artists", err);
      }
    };

    void fetchArtists();
  }, []);

  const handleArtistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName.trim() || !artistXUrl.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインが必要です");
      router.push("/login");
      return;
    }

    setSubmitting("artist");
    setError(null);

    try {

      const payload: RequestInsert = {
        type: "artist",
        user_id: user?.id ?? null,
        status: "pending",
        artist_name: artistName.trim(),
        artist_reading: artistReading.trim() || null,
        artist_x_url: artistXUrl.trim(),
      };

      const { error: insertError } = await supabase.from("requests").insert(payload);

      if (insertError) throw insertError;

      setArtistName("");
      setArtistReading("");
      setArtistXUrl("");
      showSuccessToast();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err);
      setError(errorMessage);
      alert(`送信に失敗しました: ${errorMessage}`);
      console.error("Submission error:", err);
    } finally {
      setSubmitting(null);
    }
  };

  const handleSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId || !songTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインが必要です");
      router.push("/login");
      return;
    }

    setSubmitting("song");
    setError(null);

    try {

      const payload: RequestInsert = {
        type: "song",
        user_id: user?.id ?? null,
        status: "pending",
        related_artist_id: selectedArtistId || null,
        song_title: songTitle.trim(),
        youtube_url: youtubeUrl.trim() || null,
        apple_music_url: appleMusicUrl.trim() || null,
        amazon_music_url: amazonMusicUrl.trim() || null,
      };

      const { error: insertError } = await supabase.from("requests").insert(payload);

      if (insertError) throw insertError;

      setSelectedArtistId("");
      setSongTitle("");
      setYoutubeUrl("");
      setAppleMusicUrl("");
      setAmazonMusicUrl("");
      showSuccessToast();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err);
      setError(errorMessage);
      alert(`送信に失敗しました: ${errorMessage}`);
      console.error("Submission error:", err);
    } finally {
      setSubmitting(null);
    }
  };

  const handleMixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const measuresNum = mixMeasures.trim() === "" ? null : parseInt(mixMeasures, 10);
    if (!mixTitle.trim() || !mixContent.trim() || mixMeasures.trim() === "" || measuresNum === null || Number.isNaN(measuresNum)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインが必要です");
      router.push("/login");
      return;
    }

    setSubmitting("mix");
    setError(null);

    try {

      const payload: RequestInsert = {
        type: "mix",
        user_id: user?.id ?? null,
        status: "pending",
        mix_title: mixTitle.trim(),
        mix_content: mixContent.trim(),
        measures: measuresNum != null && !Number.isNaN(measuresNum) ? measuresNum : null,
        reference_url: referenceUrl.trim() || null,
        remarks: mixRemarks.trim() || null,
      };

      const { error: insertError } = await supabase.from("requests").insert(payload);

      if (insertError) throw insertError;

      setMixTitle("");
      setMixContent("");
      setMixMeasures("");
      setReferenceUrl("");
      setMixRemarks("");
      showSuccessToast();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err);
      setError(errorMessage);
      alert(`送信に失敗しました: ${errorMessage}`);
      console.error("Submission error:", err);
    } finally {
      setSubmitting(null);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryContent.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインが必要です");
      router.push("/login");
      return;
    }

    setSubmitting("inquiry");
    setError(null);

    try {

      const payload: RequestInsert = {
        type: "inquiry",
        user_id: user?.id ?? null,
        status: "pending",
        content: inquiryContent.trim(),
        category,
      };

      console.log("Sending payload:", {
        category,
        content: inquiryContent.trim(),
        user_id: user?.id,
      });

      const { error: insertError } = await supabase.from("requests").insert(payload);

      if (insertError) throw insertError;

      setInquiryContent("");
      showSuccessToast();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : JSON.stringify(err);
      setError(errorMessage);
      alert(`送信に失敗しました: ${errorMessage}`);
      console.error("Submission error details:", JSON.stringify(err, null, 2));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        {toastMessage && (
          <div className="mb-3 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-2 text-center text-xs font-medium text-emerald-200">
            {toastMessage}
          </div>
        )}
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-zinc-300" />
            <h1 className="text-xl font-semibold tracking-tight">リクエスト</h1>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            アーティスト追加、楽曲のコール表作成、MIX追加、その他のご要望をお送りください。
          </p>
        </header>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* タブ式フォーム */}
        <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
          <CardContent className="p-5">
            <Tabs defaultValue="artist" className="w-full">
              <TabsList className="mb-4 grid h-auto grid-cols-4 gap-1 rounded-xl bg-zinc-900 p-1">
                <TabsTrigger
                  value="artist"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">アーティスト</span>
                </TabsTrigger>
                <TabsTrigger
                  value="song"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">楽曲</span>
                </TabsTrigger>
                <TabsTrigger
                  value="mix"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <Headphones className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">MIX</span>
                </TabsTrigger>
                <TabsTrigger
                  value="inquiry"
                  className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium data-[state=active]:bg-zinc-50 data-[state=active]:text-black sm:px-3 sm:text-xs"
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">問い合わせ</span>
                </TabsTrigger>
              </TabsList>

              {/* アーティストタブ */}
              <TabsContent value="artist" className="space-y-4 text-xs">
                <form onSubmit={handleArtistSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="artist-name" className="text-sm font-medium text-zinc-300">
                      アーティスト名 <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="artist-name"
                      placeholder="例: ◯◯◯◯"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      required
                      disabled={submitting === "artist"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist-reading" className="text-sm font-medium text-zinc-300">
                      読み方 (カタカナ)
                    </Label>
                    <Input
                      id="artist-reading"
                      placeholder="アーティストメイ"
                      value={artistReading}
                      onChange={(e) => setArtistReading(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={submitting === "artist"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist-x-url" className="text-sm font-medium text-zinc-300">
                      X(Twitter)のURL <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="artist-x-url"
                      type="url"
                      placeholder="https://x.com/..."
                      value={artistXUrl}
                      onChange={(e) => setArtistXUrl(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      required
                      disabled={submitting === "artist"}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="inline-flex items-center gap-1 rounded-full px-8"
                      disabled={submitting === "artist" || !artistName.trim() || !artistXUrl.trim()}
                    >
                      <Send className="h-3 w-3" />
                      {submitting === "artist" ? "送信中..." : "送信"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* 楽曲タブ */}
              <TabsContent value="song" className="space-y-4 text-xs">
                <form onSubmit={handleSongSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-zinc-300">
                      アーティスト選択 <span className="text-red-400">*</span>
                    </Label>
                    <Combobox
                      options={artistOptions}
                      value={selectedArtistId}
                      onValueChange={setSelectedArtistId}
                      placeholder="アーティストを検索・選択..."
                      searchPlaceholder="アーティスト名で検索..."
                      emptyText="アーティストが見つかりません"
                      disabled={submitting === "song"}
                    />
                    <p className="text-[10px] text-zinc-500">
                      登録済みのアーティストから選択してください。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="song-title" className="text-sm font-medium text-zinc-300">
                      曲名 (Song Name) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="song-title"
                      placeholder="曲名を入力"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      required
                      disabled={submitting === "song"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url" className="text-sm font-medium text-zinc-300">
                      YouTube URL（任意）
                    </Label>
                    <Input
                      id="youtube-url"
                      type="url"
                      placeholder="https://youtu.be/..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={submitting === "song"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apple-music-url" className="text-sm font-medium text-zinc-300">
                      Apple Music URL（任意）
                    </Label>
                    <Input
                      id="apple-music-url"
                      type="url"
                      placeholder="https://music.apple.com/..."
                      value={appleMusicUrl}
                      onChange={(e) => setAppleMusicUrl(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={submitting === "song"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amazon-music-url" className="text-sm font-medium text-zinc-300">
                      Amazon Music URL（任意）
                    </Label>
                    <Input
                      id="amazon-music-url"
                      type="url"
                      placeholder="https://music.amazon.co.jp/..."
                      value={amazonMusicUrl}
                      onChange={(e) => setAmazonMusicUrl(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={submitting === "song"}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="inline-flex items-center gap-1 rounded-full px-8"
                      disabled={submitting === "song" || !selectedArtistId || !songTitle.trim()}
                    >
                      <Send className="h-3 w-3" />
                      {submitting === "song" ? "送信中..." : "送信"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* MIXタブ */}
              <TabsContent value="mix" className="space-y-4 text-xs">
                <form onSubmit={handleMixSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mix-title" className="text-sm font-medium text-zinc-300">
                      MIXのタイトル <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="mix-title"
                      placeholder="例: スタンダードMix"
                      value={mixTitle}
                      onChange={(e) => setMixTitle(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      required
                      disabled={submitting === "mix"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mix-content" className="text-sm font-medium text-zinc-300">
                      コールの中身 <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      id="mix-content"
                      rows={5}
                      placeholder="例: タイガー、ファイヤー、サイバー、ファイバー、ダイバー、バイバー、ジャージャー！"
                      value={mixContent}
                      onChange={(e) => setMixContent(e.target.value)}
                      className="rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      required
                      disabled={submitting === "mix"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mix-measures" className="text-sm font-medium text-zinc-300">
                      小節数 (Measures) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="mix-measures"
                      type="number"
                      min={1}
                      placeholder="例: 8"
                      value={mixMeasures}
                      onChange={(e) => setMixMeasures(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      required
                      disabled={submitting === "mix"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference-url" className="text-sm font-medium text-zinc-300">
                      参考動画URL
                    </Label>
                    <Input
                      id="reference-url"
                      type="url"
                      placeholder="https://..."
                      value={referenceUrl}
                      onChange={(e) => setReferenceUrl(e.target.value)}
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={submitting === "mix"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mix-remarks" className="text-sm font-medium text-zinc-300">
                      備考 (Remarks)（任意）
                    </Label>
                    <Textarea
                      id="mix-remarks"
                      rows={3}
                      placeholder="サビ前で入ります / 特殊な発動タイミングです"
                      value={mixRemarks}
                      onChange={(e) => setMixRemarks(e.target.value)}
                      className="rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      disabled={submitting === "mix"}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="inline-flex items-center gap-1 rounded-full px-8"
                      disabled={
                        submitting === "mix" ||
                        !mixTitle.trim() ||
                        !mixContent.trim() ||
                        mixMeasures.trim() === "" ||
                        Number.isNaN(parseInt(mixMeasures, 10))
                      }
                    >
                      <Send className="h-3 w-3" />
                      {submitting === "mix" ? "送信中..." : "送信"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* 問い合わせタブ */}
              <TabsContent value="inquiry" className="space-y-4 text-xs">
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="mb-4">
                    <Label htmlFor="inquiry-category" className="mb-2 block text-sm font-bold text-zinc-300">
                      お問い合わせ種別
                    </Label>
                    <select
                      id="inquiry-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as "request" | "other")}
                      className="w-full rounded-lg border border-zinc-800 bg-black p-3 text-sm text-zinc-100"
                      disabled={submitting === "inquiry"}
                    >
                      <option value="request">機能改善・要望</option>
                      <option value="other">その他のお問い合わせ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-content" className="text-sm font-medium text-zinc-300">
                      お問い合わせ内容 <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      id="inquiry-content"
                      rows={5}
                      placeholder="ご質問やご要望をご記入ください。"
                      value={inquiryContent}
                      onChange={(e) => setInquiryContent(e.target.value)}
                      className="rounded-xl border-zinc-800 bg-zinc-900 text-sm"
                      required
                      disabled={submitting === "inquiry"}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="inline-flex items-center gap-1 rounded-full px-8"
                      disabled={submitting === "inquiry" || !inquiryContent.trim()}
                    >
                      <Send className="h-3 w-3" />
                      {submitting === "inquiry" ? "送信中..." : "送信"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
