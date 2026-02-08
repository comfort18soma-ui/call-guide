export const runtime = "edge";

import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const alt = "Call Guide Song Detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  const css = await fetch(url).then((res) => res.text());
  const match = css.match(/src:\s*url\(([^)]+)\)\s+format\('(woff2|opentype|truetype)'\)/);
  if (match) {
    const fontUrl = match[1].replace(/^["']|["']$/g, "");
    const response = await fetch(fontUrl);
    if (response.ok) return response.arrayBuffer();
  }
  throw new Error("Failed to load font data");
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: songId } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let title = "Call Guide";
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

  const fontData = await loadGoogleFont(title + artistName + "コール表CallGuide");

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

        <div
          style={{
            fontSize: 36,
            color: "#94a3b8",
            marginBottom: 20,
          }}
        >
          {artistName}
        </div>

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

        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            display: "flex",
            alignItems: "center",
          }}
        >
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
