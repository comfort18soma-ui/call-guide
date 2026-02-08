import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// フォントファイルを扱うため Node.js ランタイムを使用
export const runtime = 'nodejs'

export const alt = 'Call Guide Song Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ id: string }>
}

const ZEN_KAKU_FONT_URL =
  'https://raw.githubusercontent.com/googlefonts/zen-kaku-gothic-new/main/fonts/ttf/ZenKakuGothicNew-Bold.ttf'

export default async function Image({ params }: Props) {
  // ID取得 (Next.js 15対応)
  const { id: songId } = await params

  // 1. フォント取得: Zen Kaku Gothic New (Bold) の TTFファイルを直接取得
  const fontData = await fetch(ZEN_KAKU_FONT_URL).then((res) => res.arrayBuffer())

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
          color: '#333333',
          fontFamily: '"ZenKakuGothicNew"',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* 曲名 */}
          <div style={{
            fontSize: 90,
            fontWeight: 'bold',
            lineHeight: 1.1,
            wordBreak: 'break-word',
            marginBottom: '20px',
            color: '#000000',
            letterSpacing: '-0.03em',
          }}>
            {title}
          </div>

          {/* サブタイトル: コール表 */}
          <div style={{
            fontSize: 40,
            fontWeight: 'bold',
            marginBottom: '30px',
            backgroundColor: '#f4f4f4',
            color: '#000',
            padding: '8px 24px',
            borderRadius: '6px',
            alignSelf: 'flex-start',
          }}>
            {subTitle}
          </div>

          {/* アーティスト名 */}
          <div style={{
            fontSize: 40,
            color: '#666666',
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
            width: '44px',
            height: '44px',
            fontSize: 20,
            fontWeight: 'bold',
            marginRight: '16px',
            borderRadius: '4px',
          }}>
            CG
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
            Call Guide
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'ZenKakuGothicNew',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
