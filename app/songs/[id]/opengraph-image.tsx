export const runtime = "edge";

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

const size = { width: 1200, height: 630 };
export const alt = "Call Guide Song Detail";
export const contentType = "image/png";

const FONT_BOLD_URL =
  "https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY3w.woff2";

async function loadNotoSansJPBold(): Promise<ArrayBuffer> {
  const res = await fetch(FONT_BOLD_URL);
  if (!res.ok) throw new Error("Failed to load Noto Sans JP Bold");
  return res.arrayBuffer();
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: songId } = await params;
  const fontData = await loadNotoSansJPBold();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let title = "Unknown Song";
  let artistName = "Unknown Artist";

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: song } = await supabase
      .from("songs")
      .select("title, artists(name)")
      .eq("id", songId)
      .single();

    const row = song as { title?: string; artists?: { name?: string } | null } | null;
    if (row?.title) title = row.title;
    if (row?.artists?.name) artistName = row.artists.name;
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #000000 60%, #004e69 100%)",
          color: "white",
          fontFamily: "Noto Sans JP",
          position: "relative",
        }}
      >
        {/* 背景装飾（薄い円） */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(0,168,225,0.2) 0%, rgba(0,0,0,0) 70%)",
            borderRadius: "50%",
          }}
        />

        {/* 曲名（中央・大きく） */}
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            textAlign: "center",
            padding: "0 40px",
            lineHeight: 1.1,
            maxWidth: "1000px",
            wordBreak: "break-word",
            textShadow: "0 4px 10px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </div>

        {/* 「コール表」バッジ */}
        <div
          style={{
            marginTop: 30,
            background: "white",
            color: "black",
            padding: "10px 40px",
            borderRadius: "50px",
            fontSize: 32,
            fontWeight: "bold",
            boxShadow: "0 4px 15px rgba(255,255,255,0.3)",
          }}
        >
          コール表
        </div>

        {/* 下部：アーティスト名 */}
        <div
          style={{
            marginTop: 40,
            fontSize: 36,
            color: "#94a3b8",
          }}
        >
          {artistName}
        </div>

        {/* 右下：サイト名 */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#E11D48",
              width: 12,
              height: 12,
              borderRadius: "50%",
              marginRight: 10,
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#e2e8f0",
            }}
          >
            Call Guide
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
