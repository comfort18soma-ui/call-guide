import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Call Guide Artist Detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(text: string): Promise<ArrayBuffer | null> {
  const url = `https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700&text=${encodeURIComponent(text)}`;

  try {
    const css = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
      },
    }).then((res) => res.text());

    const resource = css.match(
      /src: url\((.+)\) format\('(opentype|truetype|woff|woff2)'\)/
    );

    if (resource && resource[1]) {
      const fontUrl = resource[1].replace(/^["']|["']$/g, "").trim();
      const response = await fetch(fontUrl);
      if (response.status === 200) return response.arrayBuffer();
    }
  } catch (e) {
    console.error("Font load failed:", e);
  }
  return null;
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: artistId } = await params;

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

  const textToRender = artistName + "コール表楽曲一覧CallGuideIDOLCG≒";
  const fontData = await loadGoogleFont(textToRender);

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
          fontFamily: fontData ? "Zen Kaku Gothic New, sans-serif" : "sans-serif",
          position: "relative",
        }}
      >
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

        <div
          style={{
            fontSize: 24,
            color: "#e9d5ff",
            marginBottom: 20,
            letterSpacing: "0.1em",
          }}
        >
          IDOL CALL GUIDE
        </div>

        <div
          style={{
            fontSize: 130,
            fontWeight: "bold",
            textAlign: "center",
            padding: "0 40px",
            lineHeight: 1.1,
            maxWidth: "1100px",
            wordBreak: "break-word",
            textShadow: "0 4px 10px rgba(0,0,0,0.6)",
            marginBottom: 40,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {artistName}
        </div>

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
          コール表・楽曲一覧
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
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
      fonts: fontData
        ? [
            {
              name: "Zen Kaku Gothic New",
              data: fontData,
              style: "normal" as const,
              weight: 700,
            },
          ]
        : [],
    }
  );
}
