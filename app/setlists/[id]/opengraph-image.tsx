import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: setlist } = await supabase
    .from('setlists')
    .select('title, user_id')
    .eq('id', id)
    .single()

  const title = setlist?.title || 'セットリスト'
  let authorName = 'Call Guide User'

  if (setlist?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, handle')
      .eq('id', setlist.user_id)
      .single()
    if (profile) {
      authorName = profile.username || profile.handle || 'Call Guide User'
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Noto Sans JP", sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: '4px solid #f0f0f0',
            borderRadius: '20px',
            zIndex: 0,
          }}
        />
        <div
          style={{
            fontSize: 100,
            fontWeight: 900,
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: 40,
            zIndex: 1,
            maxWidth: '1000px',
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 48,
            color: '#666',
            fontWeight: 500,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          by {authorName}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            right: 70,
            fontSize: 24,
            fontWeight: 'bold',
            color: '#ccc',
            zIndex: 1,
            display: 'flex',
            gap: 8,
          }}
        >
          <div style={{ width: 10, height: 10, background: '#ccc', borderRadius: '50%' }} />
          Call Guide
        </div>
      </div>
    ),
    { ...size }
  )
}
