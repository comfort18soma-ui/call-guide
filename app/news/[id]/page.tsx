import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

type NewsDetail = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
};

function toPlainText(html: string | null): string {
  if (!html) return "";
  // 改行用 <br> を優先的に改行コードへ
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  // その他のタグを除去
  text = text.replace(/<[^>]*>/g, "");
  return text;
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("news")
    .select("id, title, content, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const news = data as NewsDetail;
  const dateLabel = news.created_at
    ? new Date(news.created_at).toLocaleDateString("ja-JP")
    : "";
  const body = toPlainText(news.content);

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            {news.title || "（タイトルなし）"}
          </h1>
          {dateLabel && (
            <p className="mt-1 text-xs text-zinc-500">投稿日: {dateLabel}</p>
          )}
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
            {body || "（本文なし）"}
          </p>
        </section>

        <div className="mt-6">
          <Link
            href="/news"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition"
          >
            ← お知らせ一覧に戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

