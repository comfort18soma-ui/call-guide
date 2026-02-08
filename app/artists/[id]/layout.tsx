import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = await supabase
    .from("artists")
    .select("name")
    .eq("id", id)
    .single();

  const row = data as { name?: string } | null;
  const name = row?.name ?? "アーティスト";
  const description = `${name}のコール表・楽曲一覧 | Call Guide`;

  return {
    title: `${name} | Call Guide`,
    description,
    openGraph: {
      title: `${name} | Call Guide`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Call Guide`,
      description,
    },
  };
}

export default function ArtistIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
