import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// ★RuntimeはNode.jsを使用（フォント処理用）
export const runtime = 'nodejs'

export const alt = 'Call Guide Artist Detail'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Next.js 15対応: paramsの型定義をPromiseに変更
type Props = {
  params: Promise<{ id: string }>
}

export default async function Image({ params }: Props) {
  // ★最重要修正: paramsをawaitしてIDを取り出す
  const { id: artistId } = await params

  // 1. フォント取得 (CDNから直接)
  const fontData = await fetch(
    `https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf`
  ).then((res) => res.arrayBuffer())

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: artist } = await supabase
    .from('artists') // ※テーブル名が groups の場合は修正してください
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
          alignItems: 'flex-start', // 左寄せ
          justifyContent: 'center', // 上下中央
          padding: '80px',
          backgroundColor: '#ffffff', // Note風の白背景
          color: '#000000',
        }}
      >
        {/* アーティスト名（超巨大・太字） */}
        <div style={{
          fontSize: 110,
          fontWeight: 'bold',
          lineHeight: 1.1,
          fontFamily: '"NotoSansCJKjp"',
          wordBreak: 'break-word',
          marginBottom: '60px', // ロゴとの間隔
        }}>
          {artistName}
        </div>

        {/* フッター（ロゴ） */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          bottom: '60px',
          left: '80px',
        }}>
          {/* CGアイコン */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50px',
            height: '50px',
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '6px',
            fontSize: 24,
            fontWeight: 'bold',
            marginRight: '16px',
          }}>
            CG
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 28, fontWeight: 'bold', color: '#000' }}>Call Guide</span>
            <span style={{ fontSize: 18, color: '#666' }}>アイドルコール・MIX共有サイト</span>
          </div>
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
