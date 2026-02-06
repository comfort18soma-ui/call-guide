"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, FolderOpen, Loader2, User, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type CallSectionRow = {
  id: string;
  section_name: string;
  content: string;
  order_index: number;
};

type CallChartRow = {
  id: string;
  song_id: number;
  author_id: string | null;
  title: string | null;
  status: string;
  created_at: string;
  songs: { title?: string; artist?: string; artists?: { name?: string } | null } | null;
  profiles: { username: string | null } | null;
  call_sections: CallSectionRow[];
};

export default function AdminCallsPage() {
  const [statusTab, setStatusTab] = useState<"pending" | "approved">("pending");
  const [charts, setCharts] = useState<CallChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("call_charts")
      .select(`
        *,
        profiles!call_charts_author_id_fkey ( username, handle ),
        songs ( title, artists ( name ) ),
        call_sections ( * )
      `)
      .eq("status", statusTab)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching requests:", fetchError);
      setError(fetchError.message);
      setCharts([]);
    } else {
      const rows = (data ?? []) as CallChartRow[];
      setCharts(
        rows.map((r) => ({
          ...r,
          call_sections: (r.call_sections ?? []).sort((a, b) => a.order_index - b.order_index),
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchRequests();
  }, [statusTab]);

  const handleApprove = async (chart: CallChartRow) => {
    setSavingId(chart.id);
    try {
      const { error: updateError } = await supabase
        .from("call_charts")
        .update({ status: "approved" })
        .eq("id", chart.id);

      if (updateError) throw updateError;
      setCharts((prev) => prev.filter((c) => c.id !== chart.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`承認に失敗しました: ${msg}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleReject = async (chart: CallChartRow) => {
    setSavingId(chart.id);
    try {
      const { error: updateError } = await supabase
        .from("call_charts")
        .update({ status: "rejected" })
        .eq("id", chart.id);

      if (updateError) throw updateError;
      setCharts((prev) => prev.filter((c) => c.id !== chart.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`却下に失敗しました: ${msg}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？この操作は取り消せません。")) return;

    setSavingId(id);
    try {
      const { error: deleteError } = await supabase.from("call_charts").delete().eq("id", id);

      if (deleteError) throw deleteError;
      setCharts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`削除に失敗しました: ${msg}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">コール表 承認</h1>
            <p className="mt-2 text-sm text-zinc-400">
              コール表（call_charts）の承認・却下。承認時はステータスのみ更新します。
            </p>
          </div>
          <Link href="/admin/requests">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              リクエスト管理へ
            </Button>
          </Link>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* コール表リクエスト一覧 */}
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-200">コール表リクエスト一覧</h2>
          <p className="mb-4 text-sm text-zinc-500">
            call_charts の承認・却下、または承認済み一覧の確認・削除。
          </p>

          {/* タブ: 承認待ち / 承認済み */}
          <div className="mb-4 flex gap-2">
            <Button
              variant={statusTab === "pending" ? "default" : "outline"}
              size="sm"
              className="rounded-xl border-zinc-700 text-zinc-200 data-[state=default]:bg-zinc-100 data-[state=default]:text-black hover:bg-zinc-200"
              onClick={() => setStatusTab("pending")}
            >
              承認待ち
            </Button>
            <Button
              variant={statusTab === "approved" ? "default" : "outline"}
              size="sm"
              className="rounded-xl border-zinc-700 text-zinc-200 data-[state=default]:bg-zinc-100 data-[state=default]:text-black hover:bg-zinc-200"
              onClick={() => setStatusTab("approved")}
            >
              承認済み
            </Button>
          </div>

          <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
            <CardContent className="p-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : charts.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  {statusTab === "pending" ? "承認待ちのコール表はありません" : "承認済みのコール表はありません"}
                </div>
              ) : (
                <>
                  {/* ヘッダー行 */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-zinc-500 border-b border-zinc-800 whitespace-nowrap">
                    <div className="col-span-2">グループ名</div>
                    <div className="col-span-3">曲名</div>
                    <div className="col-span-2">作成者</div>
                    <div className="col-span-3">申請日</div>
                    <div className="col-span-2 text-right">操作</div>
                  </div>
                  <ul className="divide-y divide-zinc-800">
                    {charts.map((chart) => {
                      const isOpen = expandedIds.has(chart.id);
                      const artistName =
                        chart.songs?.artist ??
                        (chart.songs?.artists && typeof chart.songs.artists === "object" && "name" in chart.songs.artists
                          ? (chart.songs.artists as { name?: string }).name
                          : null) ??
                        "—";
                      return (
                        <li key={chart.id} className="rounded-lg overflow-hidden">
                          {/* データ行: grid-cols-12 でヘッダーと揃える */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleExpanded(chart.id)}
                            onKeyDown={(e) => e.key === "Enter" && toggleExpanded(chart.id)}
                            className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px] text-xs"
                          >
                            <div className="col-span-2 min-w-0 font-medium truncate text-zinc-200" title={artistName}>
                              {artistName}
                            </div>
                            <div className="col-span-3 truncate text-zinc-100 min-w-0">
                              <Link
                                href={`/songs/${chart.song_id}`}
                                className="hover:underline hover:text-white"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {chart.songs?.title ?? `ID: ${chart.song_id}`}
                              </Link>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5 truncate min-w-0 text-zinc-400">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {(chart.profiles?.handle || chart.author_id) ? (
                                  <Link
                                    href={`/users/${chart.profiles?.handle || chart.author_id}`}
                                    className="hover:underline hover:text-zinc-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {chart.profiles?.username ?? "名無し"}
                                  </Link>
                                ) : (
                                  chart.profiles?.username ?? "名無し"
                                )}
                              </span>
                            </div>
                            <div className="col-span-3 text-zinc-400 whitespace-nowrap">
                              {new Date(chart.created_at).toLocaleDateString("ja-JP")}
                            </div>
                            <div className="col-span-2 flex justify-end gap-1.5 items-center">
                              <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                                {statusTab === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-7 rounded-md text-xs px-2"
                                      onClick={() => handleApprove(chart)}
                                      disabled={savingId !== null}
                                    >
                                      {savingId === chart.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                      承認
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-7 rounded-md text-xs px-2"
                                      onClick={() => handleReject(chart)}
                                      disabled={savingId !== null}
                                    >
                                      <X className="h-3 w-3" />
                                      却下
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 w-7 shrink-0 rounded-md border-red-800 bg-red-950/80 p-0 text-red-300 hover:bg-red-900/80"
                                  onClick={() => handleDelete(chart.id)}
                                  disabled={savingId !== null}
                                  title="削除"
                                >
                                  {savingId === chart.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                                aria-hidden
                              />
                            </div>
                          </div>

                          {/* 開いた状態: call_sections テーブル */}
                          {isOpen && (
                            <div className="px-4 py-3 bg-zinc-950/50 border-t border-zinc-800">
                              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                                コール表の内容
                              </p>
                              {(chart.call_sections ?? []).length === 0 ? (
                                <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-500">
                                  行データなし
                                </p>
                              ) : (
                                <div className="overflow-hidden rounded-lg border border-zinc-800">
                                  <table className="w-full text-left text-sm">
                                    <thead>
                                      <tr className="border-b border-zinc-800 bg-zinc-900/80">
                                        <th className="w-[140px] px-3 py-2 font-medium text-zinc-400">場所</th>
                                        <th className="px-3 py-2 font-medium text-zinc-400">内容</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(chart.call_sections ?? []).map((sec) => (
                                        <tr key={sec.id} className="border-b border-zinc-800/80 last:border-0">
                                          <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-300">
                                            {sec.section_name || "—"}
                                          </td>
                                          <td className="px-3 py-2 whitespace-pre-wrap text-zinc-400">
                                            {sec.content || "（内容なし）"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
