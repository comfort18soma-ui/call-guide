export const runtime = "edge";

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

const size = { width: 1200, height: 630 };
export const alt = "Call Guide Artist Detail";
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
  const { id: artistId } = await params;
  const fontData = await loadNotoSansJPBold();

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
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #000000 50%, #581c87 100%)",
          color: "white",
          fontFamily: "Noto Sans JP",
          position: "relative",
        }}
      >
        {/* 背景装飾 */}
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "700px",
            height: "700px",
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(0,0,0,0) 70%)",
            borderRadius: "50%",
          }}
        />

        {/* サブタイトル */}
        <div
          style={{
            fontSize: 28,
            color: "#e9d5ff",
            marginBottom: 16,
            letterSpacing: "0.1em",
          }}
        >
          IDOL CALL GUIDE
        </div>

        {/* アーティスト名 */}
        <div
          style={{
            fontSize: 80,
            fontWeight: "bold",
            textAlign: "center",
            padding: "0 40px",
            lineHeight: 1.1,
            maxWidth: "1000px",
            wordBreak: "break-word",
            textShadow: "0 4px 10px rgba(0,0,0,0.6)",
            marginBottom: 30,
          }}
        >
          {artistName}
        </div>

        {/* 「コール表・楽曲一覧」バッジ */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            color: "white",
            padding: "12px 48px",
            borderRadius: "12px",
            fontSize: 32,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          }}
        >
          {/* 簡易リストアイコン */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "4px",
                background: "white",
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                width: "24px",
                height: "4px",
                background: "white",
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                width: "16px",
                height: "4px",
                background: "white",
                borderRadius: "2px",
              }}
            />
          </div>
          コール表・楽曲一覧
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
              background: "white",
              color: "black",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: "bold",
              marginRight: 12,
            }}
          >
            CG
          </div>
          <span
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#e2e8f0",
              letterSpacing: "0.05em",
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
