import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// 安定稼働のためにNode.jsランタイムを使用
export const runtime = 'nodejs'

export const alt = 'Call Guide Artist Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ id: string }>
}

// Google Fonts APIから、必要な文字だけの軽量フォントを取得する関数
async function loadGoogleFont(text: string) {
  // 文字の重複を削除し、URLエンコード
  const uniqueChars = Array.from(new Set(text.split(''))).sort().join('')
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(uniqueChars)}`

  try {
    const css = await fetch(url, {
      headers: {
        // WOFF2形式を取得するためにUser-Agentを偽装
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
      },
    }).then((res) => res.text())

    // CSSからフォントファイルのURLを抽出（引用符対応）
    const resource = css.match(/src: url\((?:'|")?([^'"]+)(?:'|")?\)/)

    if (resource && resource[1]) {
      const response = await fetch(resource[1])
      if (response.status === 200) {
        return await response.arrayBuffer()
      }
    }
  } catch (e) {
    console.error("Font load failed:", e)
  }
  return null
}

export default async function Image({ params }: Props) {
  // Next.js 15対応: ID待機
  const { id: artistId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: artist } = await supabase
    .from('artists') // または groups
    .select('name')
    .eq('id', artistId)
    .single()

  const artistName = artist?.name ?? 'Unknown Artist'

  // ★重要: 表示する文字セットに「≒」などの記号を必ず含める
  const textToRender = artistName + "CallGuideCG≒"
  const fontData = await loadGoogleFont(textToRender)

  // フォント取得に失敗しても、とりあえず表示はさせるためのフォールバック
  const fontFamily = fontData ? '"Noto Sans JP"' : 'sans-serif'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#ffffff', // 白背景
          color: '#000000', // 黒文字
        }}
      >
        {/* アーティスト名 */}
        <div style={{
          fontSize: 100,
          fontWeight: 'bold',
          lineHeight: 1.2,
          fontFamily: fontFamily,
          wordBreak: 'break-word',
          marginBottom: '60px',
          letterSpacing: '-0.02em',
        }}>
          {artistName}
        </div>

        {/* フッター */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          bottom: '60px',
          left: '80px',
          borderTop: '2px solid #000',
          paddingTop: '20px',
          width: '1040px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#fff',
            width: '44px',
            height: '44px',
            fontSize: 20,
            fontWeight: 'bold',
            marginRight: '16px',
            borderRadius: '4px',
            fontFamily: fontFamily,
          }}>
            CG
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', fontFamily: fontFamily }}>Call Guide</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'Noto Sans JP', data: fontData, style: 'normal', weight: 700 }] : [],
    }
  )
}
