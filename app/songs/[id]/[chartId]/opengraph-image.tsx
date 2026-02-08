import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export const alt = 'Call Guide Song Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ id: string; chartId: string }>
}

export default async function Image({ params }: Props) {
  const { chartId } = await params

  const fontData = await fetch(
    `https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf`
  ).then((res) => res.arrayBuffer())

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
          Call Guide
        </div>
      ),
      { ...size }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase
    .from('call_charts')
    .select('id, songs(title, artists(name))')
    .eq('id', chartId)
    .single()

  if (error || !data) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          Not Found
        </div>
      ),
      { ...size }
    )
  }

  const raw = data as { songs?: { title?: string; artists?: unknown } | null } | null
  const title = raw?.songs?.title ?? 'コール表'

  const artistData = raw?.songs?.artists as any
  const artistNameFromRelation = Array.isArray(artistData)
    ? artistData[0]?.name
    : artistData?.name
  const artistName = artistNameFromRelation ?? '—'

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
          color: '#000000',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: 90,
            fontWeight: 'bold',
            lineHeight: 1.1,
            fontFamily: '"NotoSansCJKjp"',
            wordBreak: 'break-word',
            marginBottom: '20px',
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 40,
            color: '#555555',
            fontFamily: '"NotoSansCJKjp"',
            fontWeight: 'normal',
          }}>
            {artistName}
          </div>
        </div>

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
            padding: '4px 12px',
            fontSize: 24,
            fontWeight: 'bold',
            marginRight: '16px',
            borderRadius: '4px',
          }}>
            CG
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>Call Guide | コール表</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'NotoSansCJKjp',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
