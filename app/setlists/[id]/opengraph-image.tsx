import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const size = {
  width: 1200,
  height: 630,
}

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
  let avatarUrl: string | null = null

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
          padding: '80px',
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
            fontSize: 70,
            fontWeight: 900,
            color: '#1a1a1a',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 40,
            zIndex: 1,
            maxWidth: '900px',
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 1,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              width={48}
              height={48}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #eee',
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#e5e5e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#666',
                fontWeight: 600,
              }}
            >
              {(authorName || '?').slice(0, 1)}
            </div>
          )}
          <div
            style={{
              fontSize: 32,
              color: '#666',
              fontWeight: 500,
            }}
          >
            {authorName}
          </div>
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
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ width: 10, height: 10, background: '#ccc', borderRadius: '50%' }} />
          Call Guide
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
