import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const alt = "Call Guide Artist Detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_URL =
  "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: artistId } = await params;

  let fontData: ArrayBuffer | null = null;
  try {
    const res = await fetch(FONT_URL);
    if (res.ok) fontData = await res.arrayBuffer();
  } catch (e) {
    console.error("Font load failed:", e);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let artistName = "Unknown Artist";

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: artist } = await supabase
      .from("artists")
      .select("name")
      .eq("id", artistId)
      .single();
    const row = artist as { name?: string } | null;
    if (row?.name) artistName = row.name;
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#1a1a1a",
          color: "white",
          fontFamily: fontData ? "NotoSansCJKjp" : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 110,
            fontWeight: "bold",
            lineHeight: 1.2,
            wordBreak: "break-word",
            maxWidth: "100%",
          }}
        >
          {artistName}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderTop: "2px solid #555",
            paddingTop: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "60px",
              height: "60px",
              backgroundColor: "white",
              color: "black",
              borderRadius: "8px",
              fontSize: 28,
              fontWeight: "bold",
              marginRight: "20px",
            }}
          >
            CG
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: 32, fontWeight: "bold" }}>Call Guide</span>
            <span style={{ fontSize: 20, color: "#aaa" }}>
              アイドルコール・MIX共有サイト
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "NotoSansCJKjp",
              data: fontData,
              style: "normal" as const,
              weight: 700,
            },
          ]
        : [],
    }
  );
}
