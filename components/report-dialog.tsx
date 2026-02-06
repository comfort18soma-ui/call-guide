"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type TargetType = "call_chart" | "mix";

type ReportDialogProps = {
  targetId: string | number;
  targetType: TargetType;
};

export function ReportDialog({ targetId, targetType }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"correction" | "report">(
    "correction",
  );
  const [correctionText, setCorrectionText] = useState("");
  const [reportReason, setReportReason] = useState<
    "spam" | "abuse" | "copyright" | "other" | ""
  >("");
  const [reportDetails, setReportDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // ログイン状態チェック（初回オープン時）
  const ensureSession = async () => {
    if (isLoggedIn !== null) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setIsLoggedIn(!!session?.user?.id);
  };

  const resetState = () => {
    setActiveTab("correction");
    setCorrectionText("");
    setReportReason("");
    setReportDetails("");
    setError(null);
  };

  const handleOpenChange = async (next: boolean) => {
    if (next) {
      await ensureSession();
    } else {
      resetState();
    }
    setOpen(next);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setError("リクエストを送信するにはログインが必要です。");
        setIsLoggedIn(false);
        return;
      }

      if (activeTab === "correction") {
        if (!correctionText.trim()) {
          setError("修正内容を入力してください。");
          return;
        }
        setSubmitting(true);
        const { error: insertError } = await supabase.from("reports").insert({
          target_type: targetType,
          target_id: String(targetId),
          category: "correction",
          reason: null,
          details: correctionText.trim(),
          user_id: userId,
        });
        if (insertError) throw insertError;
      } else {
        if (!reportReason) {
          setError("報告理由を選択してください。");
          return;
        }
        setSubmitting(true);
        const { error: insertError } = await supabase.from("reports").insert({
          target_type: targetType,
          target_id: String(targetId),
          category: "report",
          reason:
            reportReason === "spam"
              ? "スパム・宣伝"
              : reportReason === "abuse"
                ? "不適切な内容・誹謗中傷"
                : reportReason === "copyright"
                  ? "著作権侵害の懸念"
                  : "その他",
          details: reportDetails.trim() || null,
          user_id: userId,
        });
        if (insertError) throw insertError;
      }

      showToast("送信しました。ご協力ありがとうございます。");
      setOpen(false);
      resetState();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : JSON.stringify(err, null, 2);
      setError(message || "送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || isLoggedIn === false;

  return (
    <>
      {toastMessage && (
        <div className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-center text-xs font-medium text-emerald-200">
          {toastMessage}
        </div>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300"
          >
            修正依頼・報告
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-zinc-100">
              修正依頼・問題の報告
            </DialogTitle>
          </DialogHeader>
          {!isLoggedIn && isLoggedIn !== null && (
            <p className="mb-2 text-xs text-red-300">
              リクエストを送信するにはログインが必要です。
            </p>
          )}
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "correction" | "report")
            }
            className="mt-2"
          >
            <TabsList variant="default" className="mb-3">
              <TabsTrigger value="correction" className="text-xs">
                修正依頼
              </TabsTrigger>
              <TabsTrigger value="report" className="text-xs">
                問題の報告
              </TabsTrigger>
            </TabsList>

            <TabsContent value="correction" className="space-y-3 text-xs">
              <p className="text-[11px] text-zinc-400">
                情報の誤りや、より良い内容への修正案があれば教えてください。
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">
                  修正内容・正しい情報
                </label>
                <Textarea
                  rows={4}
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  className="text-xs"
                  placeholder="例: 表記ゆれや誤字、より自然なコール表現など"
                  disabled={submitting || !isLoggedIn}
                />
              </div>
            </TabsContent>

            <TabsContent value="report" className="space-y-3 text-xs">
              <p className="text-[11px] text-zinc-400">
                スパムや不適切な内容を見つけた場合は、理由を選んでお知らせください。
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">
                  報告の種類
                </label>
                <div className="space-y-1">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1.5 text-[11px] text-zinc-200">
                    <input
                      type="radio"
                      className="h-3 w-3 accent-zinc-200"
                      checked={reportReason === "spam"}
                      onChange={() => setReportReason("spam")}
                      disabled={submitting || !isLoggedIn}
                    />
                    スパム・宣伝
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1.5 text-[11px] text-zinc-200">
                    <input
                      type="radio"
                      className="h-3 w-3 accent-zinc-200"
                      checked={reportReason === "abuse"}
                      onChange={() => setReportReason("abuse")}
                      disabled={submitting || !isLoggedIn}
                    />
                    不適切な内容・誹謗中傷
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1.5 text-[11px] text-zinc-200">
                    <input
                      type="radio"
                      className="h-3 w-3 accent-zinc-200"
                      checked={reportReason === "copyright"}
                      onChange={() => setReportReason("copyright")}
                      disabled={submitting || !isLoggedIn}
                    />
                    著作権侵害の懸念
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1.5 text-[11px] text-zinc-200">
                    <input
                      type="radio"
                      className="h-3 w-3 accent-zinc-200"
                      checked={reportReason === "other"}
                      onChange={() => setReportReason("other")}
                      disabled={submitting || !isLoggedIn}
                    />
                    その他
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">
                  詳細（任意）
                </label>
                <Textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="text-xs"
                  placeholder="状況や問題点が分かる範囲でご記入ください。"
                  disabled={submitting || !isLoggedIn}
                />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="mt-2 text-[11px] text-red-300">{error}</p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              size="sm"
              className="w-full rounded-lg text-xs"
              onClick={handleSubmit}
              disabled={disabled}
            >
              {submitting ? "送信中..." : "送信する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

