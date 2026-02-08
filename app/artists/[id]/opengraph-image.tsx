import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Artist Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Google Fonts APIから、必要な文字だけを含む軽量フォントを取得する関数
async function loadGoogleFont(text: string) {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`
  try {
    const res = await fetch(url)
    const css = await res.text()
    // CSSからフォントファイルのURLを抽出（より柔軟な正規表現に変更）
    const resource = css.match(/src: url\((.+?)\)/)

    if (resource && resource[1]) {
      const fontUrl = resource[1].replace(/['"]/g, '') // クォートを除去
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
    const artistId = params.id

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // データ取得
    const { data: artist, error } = await supabase
      .from('artists') // ※テーブル名が groups の場合は修正してください
      .select('name')
      .eq('id', artistId)
      .single()

    if (error || !artist) throw new Error(error?.message || 'Artist not found')

    const artistName = artist.name || 'No Name'

    // 必要な文字だけを指定してフォント取得
    const fontData = await loadGoogleFont(artistName + 'CallGuideCG')

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
            backgroundColor: '#ffffff', // Note風: 白背景
            color: '#000000',           // Note風: 黒文字
          }}
        >
          {/* アーティスト名（超極太） */}
          <div style={{
            fontSize: 130,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '40px',
            wordBreak: 'break-word',
            fontFamily: '"Noto Sans JP"',
          }}>
            {artistName}
          </div>

          {/* サイトロゴ（シンプル） */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 'auto',
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
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#444' }}>
              Call Guide
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        // フォント読み込み成功時のみ指定、失敗時はシステムフォント
        fonts: fontData ? [{ name: 'Noto Sans JP', data: fontData, style: 'normal', weight: 700 }] : [],
      }
    )
  } catch (e: any) {
    // エラー発生時は画像にエラー内容を表示（真っ白回避）
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: 'white', color: 'red', fontSize: 40, padding: 40, display: 'flex', alignItems: 'center' }}>
          Error: {e.message}
        </div>
      ), { ...size }
    )
  }
}
