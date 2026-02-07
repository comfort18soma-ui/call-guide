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

type Params = { id: string; chartId: string };

export default async function Image({
  params,
}: {
  params: Promise<Params>;
}) {
  const { chartId } = await params;

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
          <div style={{ fontSize: 24, marginBottom: 16 }}>Call Guide</div>
          <div style={{ fontSize: 32 }}>コール表</div>
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
  const { data, error } = await supabase
    .from("call_charts")
    .select("id, songs(title, artists(name))")
    .eq("id", chartId)
    .single();

  const songTitle =
    (data as { songs?: { title?: string; artists?: { name?: string } | null } | null } | null)
      ?.songs?.title ?? "コール表";
  const artistName =
    (data as { songs?: { title?: string; artists?: { name?: string } | null } | null } | null)
      ?.songs?.artists?.name ?? "—";

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
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Call Guide
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 24,
            }}
          >
            {songTitle}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {artistName}
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
