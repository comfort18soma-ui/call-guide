"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, BookOpen, Plus, Trash2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SongInfo = {
  id: number;
  title: string;
  artist_name: string;
};

type MixTemplate = {
  id: string;
  title: string;
  content: string;
};

type SectionRow = {
  section_name: string;
  content: string;
  mix_id: string | null;
};

const initialRow = (): SectionRow => ({
  section_name: "イントロ",
  content: "",
  mix_id: null,
});

export default function SongAddCallPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [song, setSong] = useState<SongInfo | null>(null);
  const [templates, setTemplates] = useState<MixTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chartTitle, setChartTitle] = useState("");
  const [chartComment, setChartComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [rows, setRows] = useState<SectionRow[]>(() => [initialRow()]);

  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryTargetIndex, setDictionaryTargetIndex] = useState<number | null>(null);
  const [mixSearch, setMixSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const songId = Number(id);
      const songIdFilter = isNaN(songId) ? id : songId;

      const [userRes, songRes, mixesRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("songs")
          .select("id, title, artist_id, artists(id, name)")
          .eq("id", songIdFilter)
          .single(),
        supabase
          .from("mixes")
          .select("id, title, content")
          .is("song_id", null)
          .order("title", { ascending: true }),
      ]);

      const user = userRes.data?.user;
      if (!user) {
        router.push("/login");
        setLoading(false);
        return;
      }
      setAuthorId(user.id);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        console.log("Profile Data:", profile);
      }

      const profileRow = profile as { username?: string; nickname?: string } | null;
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const authorNameValue =
        profileRow?.username ||
        profileRow?.nickname ||
        (meta?.display_name as string) ||
        "名無し";
      setAuthorName((typeof authorNameValue === "string" && authorNameValue.trim()) ? authorNameValue.trim() : "名無し");

      if (songRes.error) throw songRes.error;
      const songRow = songRes.data as Record<string, unknown> | null;
      if (!songRow) {
        setSong(null);
        setLoading(false);
        return;
      }
      setSong({
        id: songRow.id as number,
        title: songRow.title as string,
        artist_name: (songRow.artists as { name?: string } | null)?.name ?? "不明",
      });

      if (mixesRes.error) throw mixesRes.error;
      setTemplates((mixesRes.data ?? []) as MixTemplate[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "データの取得に失敗しました";
      setError(message);
      setSong(null);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const addRow = () => {
    setRows((prev) => [...prev, { section_name: "", content: "", mix_id: null }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateRow = (index: number, field: keyof SectionRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const openDictionary = (index: number) => {
    setDictionaryTargetIndex(index);
    setDictionaryOpen(true);
  };

  const onSelectTemplate = (mix: MixTemplate) => {
    if (dictionaryTargetIndex !== null) {
      updateRow(dictionaryTargetIndex, "content", mix.content);
      updateRow(dictionaryTargetIndex, "mix_id", mix.id);
    }
    setDictionaryOpen(false);
    setDictionaryTargetIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const songId = Number(id);
    if (Number.isNaN(songId)) return;
    const validRows = rows.filter((r) => r.content.trim());
    if (validRows.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      // 1. ユーザー確認
      const { data: { user } } = await supabase.auth.getUser();

      // 2. 送信時にその場で profiles から名前を取得
      let finalAuthorName = "名無し";
      let authorIdToSave: string | null = null;
      if (user?.id) {
        authorIdToSave = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        const profileRow = profile as { username?: string } | null;
        finalAuthorName = (profileRow?.username && profileRow.username.trim()) ? profileRow.username.trim() : "名無し";
      }

      // 3. その名前を使って保存（即時公開）
      const { data: chartData, error: chartError } = await supabase
        .from("call_charts")
        .insert({
          song_id: songId,
          author_id: authorIdToSave,
          author_name: finalAuthorName,
          title: chartTitle.trim() || null,
          comment: chartComment.trim() || null,
          status: "approved",
        })
        .select("id")
        .single();

      if (chartError) throw chartError;
      const callChartId = (chartData as { id: string })?.id;
      if (!callChartId) throw new Error("call_chart ID が取得できませんでした");

      const sections = validRows.map((r, i) => ({
        call_chart_id: callChartId,
        section_name: r.section_name.trim() || "—",
        content: r.content.trim(),
        mix_id: r.mix_id ?? null,
        order_index: i,
      }));

      const { error: sectionsError } = await supabase
        .from("call_sections")
        .insert(sections);

      if (sectionsError) throw sectionsError;

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("TOAST_CALL_CREATED", "1");
        } catch {
          // ignore
        }
      }
      router.push(`/songs/${id}/${callChartId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "送信に失敗しました";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <p className="text-sm text-zinc-500">楽曲IDが指定されていません。</p>
          <Link href="/calls" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
            ← 一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </main>
    );
  }

  if (error && !song) {
    return (
      <main className="min-h-screen bg-black pb-24 text-zinc-50">
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
          <Link href={`/songs/${id}`} className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4" />
            曲ページに戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href={`/songs/${id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          曲ページに戻る
        </Link>

        <header className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            『{song?.title}』のコールを作成
          </h1>
          {song && (
            <p className="mt-1 text-sm text-zinc-400">{song.artist_name}</p>
          )}
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
            <CardContent className="p-3 space-y-2">
              <div>
                <Label htmlFor="chart-title" className="text-xs font-medium text-zinc-300 mb-0.5 block">
                  タイトル
                </Label>
                <Input
                  id="chart-title"
                  placeholder="例: ガチ恋口上ありVer"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  className="h-9 py-1.5 text-sm rounded-xl border-zinc-800 bg-zinc-900"
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="chart-comment" className="text-xs font-medium text-zinc-300 mb-0.5 block">
                  備考（任意）
                </Label>
                <Textarea
                  id="chart-comment"
                  rows={2}
                  placeholder="このコール表についてのメモや補足"
                  value={chartComment}
                  onChange={(e) => setChartComment(e.target.value)}
                  className="py-1.5 text-sm rounded-xl border-zinc-800 bg-zinc-900 resize-y"
                  disabled={submitting}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-zinc-300 mb-0.5 block">
                  投稿者
                </Label>
                <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                  {authorName || "（マイページで投稿者名を設定してください）"}
                </p>
              </div>
            </CardContent>
          </Card>

          {rows.map((row, index) => (
            <Card key={index} className="rounded-xl border-zinc-800 bg-zinc-950/80">
              <CardContent className="p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-400 shrink-0">[ {index + 1} ]</span>
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs font-medium text-zinc-300 mb-0 block">場所</Label>
                    <Input
                      placeholder="例: イントロ, 1番Aメロ"
                      value={row.section_name}
                      onChange={(e) => updateRow(index, "section_name", e.target.value)}
                      className="h-7 py-1 text-sm rounded-lg border-zinc-800 bg-zinc-900"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-zinc-300 mb-0 block">内容</Label>
                  <div className="flex gap-2">
                    <Textarea
                      rows={2}
                      placeholder="コール内容。「MIX辞典から選ぶ」で引用できます。"
                      value={row.content}
                      onChange={(e) => updateRow(index, "content", e.target.value)}
                      className="flex-1 py-1 text-sm rounded-lg border-zinc-800 bg-zinc-900 whitespace-pre-wrap resize-y"
                      disabled={submitting}
                    />
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-lg border-zinc-700 whitespace-nowrap text-xs px-2 py-0"
                        onClick={() => openDictionary(index)}
                        disabled={submitting}
                      >
                        <BookOpen className="mr-1 h-3 w-3" />
                        MIX辞典
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-lg border-zinc-700 text-red-400 hover:text-red-300 text-xs px-2 py-0"
                        onClick={() => removeRow(index)}
                        disabled={submitting || rows.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full rounded-xl border-dashed border-zinc-700 text-sm"
            onClick={addRow}
            disabled={submitting}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            ＋行を追加
          </Button>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-zinc-700"
              disabled={submitting}
              asChild
            >
              <Link href={`/songs/${id}`}>キャンセル</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={submitting || rows.every((r) => !r.content.trim())}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                "この内容で申請する"
              )}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={dictionaryOpen} onOpenChange={setDictionaryOpen}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">MIX辞典から選ぶ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              autoFocus
              placeholder="MIX名で検索..."
              value={mixSearch}
              onChange={(e) => setMixSearch(e.target.value)}
              className="h-9 rounded-lg border-zinc-800 bg-zinc-900/60 text-sm placeholder:text-zinc-500"
            />
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-sm text-zinc-500">辞典にMIXがありません</p>
              ) : (
                (() => {
                  const q = mixSearch.trim().toLowerCase();
                  const filtered = q
                    ? templates.filter((t) => {
                        const title = t.title?.toLowerCase() ?? "";
                        const content = t.content?.toLowerCase() ?? "";
                        return title.includes(q) || content.includes(q);
                      })
                    : templates;

                  if (filtered.length === 0) {
                    return (
                      <p className="px-1 text-xs text-zinc-500">
                        見つかりません
                      </p>
                    );
                  }

                  return filtered.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-800"
                      onClick={() => {
                        onSelectTemplate(t);
                        setMixSearch("");
                      }}
                    >
                      <span className="font-medium text-zinc-200">
                        {t.title}
                      </span>
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-zinc-500">
                        {t.content}
                      </p>
                    </button>
                  ));
                })()
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
