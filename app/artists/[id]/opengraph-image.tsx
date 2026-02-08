import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export const alt = 'Call Guide Artist Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ id: string }>
}

const ZEN_KAKU_FONT_URL =
  'https://raw.githubusercontent.com/googlefonts/zen-kaku-gothic-new/main/fonts/ttf/ZenKakuGothicNew-Bold.ttf'

export default async function Image({ params }: Props) {
  const { id: artistId } = await params

  // 1. フォント取得 (Zen Kaku Gothic New TTF)
  const fontData = await fetch(ZEN_KAKU_FONT_URL).then((res) => res.arrayBuffer())

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: artist } = await supabase
    .from('artists')
    .select('name')
    .eq('id', artistId)
    .single()

  const artistName = artist?.name ?? 'Unknown Artist'

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
          backgroundColor: '#ffffff',
          color: '#333333',
          fontFamily: '"ZenKakuGothicNew"',
        }}
      >
        {/* アーティスト名 */}
        <div style={{
          fontSize: 100,
          fontWeight: 'bold',
          lineHeight: 1.1,
          wordBreak: 'break-word',
          marginBottom: '60px',
          color: '#000000',
          letterSpacing: '-0.03em',
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
