import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// ★最重要: runtime = 'nodejs' (これでメモリ不足によるグレー画像を回避)
export const runtime = 'nodejs'

export const alt = 'Song Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 軽量化のためのフォント取得関数
async function loadGoogleFont(text: string) {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`
  try {
    const res = await fetch(url)
    const css = await res.text()
    const resource = css.match(/src: url\((.+?)\)/)
    if (resource && resource[1]) {
      const fontUrl = resource[1].replace(/['"]/g, '')
      const fontRes = await fetch(fontUrl)
      return await fontRes.arrayBuffer()
    }
  } catch (e) {
    console.error('Font Load Error:', e)
    return null
  }
  return null
}

export default async function Image({ params }: { params: { id: string } }) {
  try {
    const songId = params.id

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: song, error } = await supabase
      .from('songs')
      .select('title, artist, artists(name)')
      .eq('id', songId)
      .single()

    if (error || !song) throw new Error(error?.message || 'Song not found')

    const title = song.title || 'No Title'

    // ★ビルドエラー修正箇所: artistsをany型で受けて配列チェックを行う
    const artistsData = song.artists as any
    const artistNameFromRelation = Array.isArray(artistsData)
      ? artistsData[0]?.name
      : artistsData?.name

    const artistName = artistNameFromRelation || song.artist || 'Unknown Artist'

    // フォント取得
    const fontData = await loadGoogleFont(title + artistName + 'CallGuideCG')

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '80px',
            backgroundColor: '#ffffff', // 白背景
            color: '#000000',           // 黒文字
          }}
        >
          {/* 曲名 */}
          <div style={{
            fontSize: 110,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            wordBreak: 'break-word',
            fontFamily: '"Noto Sans JP"',
          }}>
            {title}
          </div>

          {/* アーティスト名 */}
          <div style={{
            fontSize: 50,
            color: '#666666', // グレー
            fontFamily: '"Noto Sans JP"',
            marginBottom: 'auto',
          }}>
            {artistName}
          </div>

          {/* サイトロゴ */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '40px',
            borderTop: '4px solid #000', // Noteっぽいアクセント線
            paddingTop: '30px',
            width: '100%',
          }}>
            <div style={{
              background: '#000',
              color: '#fff',
              padding: '4px 12px',
              fontSize: 32,
              fontWeight: 'bold',
              borderRadius: '4px',
              marginRight: '16px',
            }}>
              CG
            </div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#000' }}>
              Call Guide
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: fontData ? [{ name: 'Noto Sans JP', data: fontData, style: 'normal', weight: 700 }] : [],
      }
    )
  } catch (e: any) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'white', color: 'red', fontSize: 40, padding: 40, display: 'flex', alignItems: 'center' }}>
          Error: {e.message}
        </div>
      ), { ...size }
    )
  }
}
