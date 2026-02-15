import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CallList from '@/components/CallList'
import EditSongLinksModal from '@/components/EditSongLinksModal'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string }>
}

export default async function SongPage({ params, searchParams }: Props) {
  const { id } = await params
  const { sort } = await searchParams
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const songId = Number(id)
  const songIdFilter = Number.isNaN(songId) ? id : songId

  const { data: song } = await supabase
    .from('songs')
    .select('*, artists(id, name)')
    .eq('id', songIdFilter)
    .single()

  if (!song) {
    notFound()
  }

  let query = supabase
    .from('call_charts')
    .select(`
      id,
      title,
      created_at,
      like_count,
      profiles!call_charts_author_id_fkey ( username, handle )
    `)
    .eq('song_id', songIdFilter)
    .eq('status', 'approved')

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false })
  }

  const { data: charts } = await query

  const artistData = song.artists as { name?: string } | null
  const artistName = (Array.isArray(artistData) ? artistData[0]?.name : artistData?.name) || (song as any).artist || 'Unknown Artist'
  const artistId = (song as any).artist_id

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen text-white">
      <div className="mb-6">
        <Link
          href={artistId ? `/artists/${artistId}` : '/calls'}
          className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
        >
          <span>←</span> アーティスト詳細に戻る
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
            <p className="text-gray-400 text-lg">{artistName}</p>
          </div>
          <EditSongLinksModal
            song={{
              id: song.id,
              youtube_url: (song as any).youtube_url ?? null,
              apple_music_url: (song as any).apple_music_url ?? null,
              amazon_music_url: (song as any).amazon_music_url ?? null,
            }}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + artistName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#ff0000] hover:bg-[#cc0000] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition"
          >
            YouTube
          </a>
          <Link
            href={`/songs/${song.id}/add`}
            className="bg-[#222] hover:bg-[#333] border border-gray-700 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition"
          >
            ＋ コールを作成
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-400 tracking-wider">コール表 (CALL CHARTS)</h2>
        </div>

        <div className="flex gap-2 mb-6">
          <Link
            href={`/songs/${id}`}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${!sort ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            人気順
          </Link>
          <Link
            href={`/songs/${id}?sort=new`}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${sort === 'new' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            新着順
          </Link>
        </div>

        <CallList charts={charts || []} songId={id} />
      </div>
    </div>
  )
}
