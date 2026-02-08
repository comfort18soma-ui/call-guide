import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = await supabase
    .from("songs")
    .select("title, artists(name)")
    .eq("id", id)
    .single();

  const row = data as { title?: string; artists?: { name?: string } | null } | null;
  const title = row?.title ?? "楽曲";
  const artistName = row?.artists?.name ?? "—";
  const description = `${title} - ${artistName}のコール表・楽曲ページ | Call Guide`;

  return {
    title: `${title} | Call Guide`,
    description,
    openGraph: {
      title: `${title} | Call Guide`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Call Guide`,
      description,
    },
  };
}

export default function SongIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
