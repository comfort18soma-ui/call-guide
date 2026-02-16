import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const runtime = "nodejs";

type NewsRow = {
  id: string;
  title: string | null;
  created_at: string;
};

export default async function NewsListPage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from("news")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  const items: NewsRow[] = (data as NewsRow[] | null) ?? [];

  return (
    <main className="min-h-screen bg-black pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">お知らせ</h1>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            お知らせの取得に失敗しました:{" "}
            {error.message ?? "不明なエラーが発生しました"}
          </div>
        )}

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">お知らせはまだありません。</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-950/70">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/news/${item.id}`}
                  className="flex items-baseline justify-between gap-3 px-4 py-3 hover:bg-zinc-900/80 transition-colors"
                >
                  <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("ja-JP")
                      : ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">
                    {item.title || "（タイトルなし）"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

