export const runtime = "edge";

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

const FONT_BOLD_URL =
  "https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY3w.woff2";

async function loadNotoSansJPBold(): Promise<ArrayBuffer> {
  const res = await fetch(FONT_BOLD_URL);
  if (!res.ok) throw new Error("Failed to load Noto Sans JP Bold");
  return res.arrayBuffer();
}

type Params = { id: string };

export default async function Image({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const fontData = await loadNotoSansJPBold();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Noto Sans JP",
            color: "white",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 48,
              left: 48,
              fontSize: 22,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Call Guide
          </div>
          <div style={{ fontSize: 48 }}>コール一覧</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
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

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = await supabase
    .from("artists")
    .select("id, name")
    .eq("id", id)
    .single();

  const artistName =
    (data as { name?: string } | null)?.name ?? "アーティスト";
  const mainText = `${artistName} のコール一覧`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Noto Sans JP",
          color: "white",
          padding: 80,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 48,
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Call Guide
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {mainText}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
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
