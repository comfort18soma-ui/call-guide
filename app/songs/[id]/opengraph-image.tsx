import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// ★APIを使うためにNode.jsランタイムを指定（これで落ちません）
export const runtime = 'nodejs'

export const alt = 'Call Guide Song Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ id: string }>
}

// フォントローダー: Noto Sans JP をAPI経由で取得（文字化け防止）
async function loadGoogleFont(text: string) {
  const uniqueChars = Array.from(new Set(text.split(''))).sort().join('')
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(uniqueChars)}`

  try {
    const css = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
      },
    }).then((res) => res.text())

    const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype|woff|woff2)'\)/)

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
  const { id: songId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: song } = await supabase
    .from('songs')
    .select('title, artist, artists(name)')
    .eq('id', songId)
    .single()

  if (!song) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>Not Found</div>,
      { ...size }
    )
  }

  const title = song.title ?? 'No Title'
  const artistData = song.artists as any
  const artistNameFromRelation = Array.isArray(artistData) ? artistData[0]?.name : artistData?.name
  const artistName = artistNameFromRelation ?? song.artist ?? 'Unknown Artist'
  const subTitle = 'コール表'

  // ★「≒」を確実に含める
  const textToRender = title + artistName + subTitle + "CallGuideCG≒"
  const fontData = await loadGoogleFont(textToRender)
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
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* 曲名 */}
          <div style={{
            fontSize: 90,
            fontWeight: 'bold',
            lineHeight: 1.1,
            fontFamily: fontFamily,
            wordBreak: 'break-word',
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </div>

          {/* コール表バッジ */}
          <div style={{
            fontSize: 40,
            fontWeight: 'bold',
            fontFamily: fontFamily,
            marginBottom: '30px',
            backgroundColor: '#000', // 黒背景
            color: '#fff', // 白文字
            padding: '4px 24px',
            borderRadius: '4px',
            alignSelf: 'flex-start',
          }}>
            {subTitle}
          </div>

          {/* アーティスト名 */}
          <div style={{
            fontSize: 40,
            color: '#666666',
            fontFamily: fontFamily,
            fontWeight: 'normal',
          }}>
            {artistName}
          </div>
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
            width: '40px',
            height: '40px',
            fontSize: 18,
            fontWeight: 'bold',
            marginRight: '12px',
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
