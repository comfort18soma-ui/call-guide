"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Slash, ExternalLink, ArrowLeft } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ReportStatus = "pending" | "resolved" | "ignored";
type ReportTargetType = "mix" | "call_chart";

type ReportRow = {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  category: "correction" | "report";
  reason: string | null;
  details: string | null;
  status: ReportStatus | null;
  created_at: string;
  call_charts?: { id: string; song_id: number | null } | null;
};

function formatStatusBadge(status: ReportStatus | null) {
  const s = status ?? "pending";
  if (s === "pending") {
    return (
      <Badge variant="outline" className="border-amber-500/60 bg-amber-500/10 text-[10px] text-amber-300">
        Pending
      </Badge>
    );
  }
  if (s === "resolved") {
    return (
      <Badge variant="outline" className="border-emerald-500/60 bg-emerald-500/10 text-[10px] text-emerald-300">
        Resolved
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-zinc-500/60 bg-zinc-800/80 text-[10px] text-zinc-300">
      Ignored
    </Badge>
  );
}

function formatCategoryLabel(category: "correction" | "report") {
  return category === "correction" ? "修正依頼" : "通報";
}

function formatTargetLabel(report: ReportRow) {
  if (report.target_type === "mix") return "MIX";
  return "コール表";
}

export default function AdminReportsPage() {
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("reports")
        .select(
          `
            id,
            target_type,
            target_id,
            category,
            reason,
            details,
            status,
            created_at,
            call_charts:call_charts!reports_target_id_fkey (
              id,
              song_id
            )
          `,
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setReports((data as ReportRow[]) ?? []);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "レポート一覧の取得に失敗しました";
      setError(msg);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const updateStatus = async (id: string, status: ReportStatus) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      await loadReports();
    } catch (err) {
      console.error(
        "レポートステータス更新エラー:",
        err instanceof Error ? err.message : JSON.stringify(err, null, 2),
      );
      alert("ステータスの更新に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  };

  const buildTargetHref = (report: ReportRow) => {
    if (report.target_type === "mix") {
      return `/mixes/${report.target_id}`;
    }
    const chart = report.call_charts;
    if (chart?.song_id != null) {
      return `/songs/${chart.song_id}/${report.target_id}`;
    }
    // フォールバック: コール表IDのみ
    return `/songs/${report.target_id}`;
  };

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              通報・修正依頼管理
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              通報・修正依頼一覧
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              ユーザーからの修正依頼や問題のある投稿の通報を確認し、対応状況を管理します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/requests">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                リクエスト管理へ戻る
              </Button>
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <Card className="rounded-xl border-zinc-800 bg-zinc-950/80">
          <CardContent className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
                読み込み中...
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                通報・修正依頼はまだありません。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">ステータス</TableHead>
                      <TableHead className="w-[80px]">種類</TableHead>
                      <TableHead className="w-[80px]">対象</TableHead>
                      <TableHead>内容</TableHead>
                      <TableHead className="whitespace-nowrap">
                        報告日時
                      </TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const href = buildTargetHref(report);
                      return (
                        <TableRow key={report.id}>
                          <TableCell>{formatStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-xs text-zinc-200">
                            {formatCategoryLabel(report.category)}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-200">
                            {formatTargetLabel(report)}
                          </TableCell>
                          <TableCell className="max-w-xl text-xs">
                            {report.category === "report" && report.reason && (
                              <div className="mb-1 text-[11px] text-rose-300">
                                理由: {report.reason}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-zinc-100">
                              {report.details || "（詳細なし）"}
                            </div>
                            <Link
                              href={href}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              対象を開く
                            </Link>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-zinc-400">
                            {new Date(report.created_at).toLocaleString(
                              "ja-JP",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="inline-flex items-center gap-1 rounded-full border-emerald-500/50 text-[11px] text-emerald-300 hover:bg-emerald-500/10"
                                disabled={updatingId === report.id}
                                onClick={() =>
                                  void updateStatus(report.id, "resolved")
                                }
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                対応済み
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="inline-flex items-center gap-1 rounded-full border-zinc-600 text-[11px] text-zinc-300 hover:bg-zinc-800"
                                disabled={updatingId === report.id}
                                onClick={() =>
                                  void updateStatus(report.id, "ignored")
                                }
                              >
                                <Slash className="h-3 w-3" />
                                無視
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

