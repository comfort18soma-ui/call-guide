import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import ShareButton from '@/components/ShareButton'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: setlist } = await supabase
    .from('setlists')
    .select('title, user_id')
    .eq('id', id)
    .single()

  const title = setlist?.title || 'セットリスト'

  let authorName = ''
  if (setlist?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, handle')
      .eq('id', setlist.user_id)
      .single()
    if (profile) {
      authorName = profile.username || profile.handle || ''
    }
  }

  return {
    title: `${title} | Call Guide`,
    description: authorName ? `${authorName}さんが作成したセットリスト` : 'セットリスト | Call Guide',
    openGraph: {
      title: title,
      description: authorName ? `作成者: ${authorName}` : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: authorName ? `作成者: ${authorName}` : undefined,
    },
  }
}

export default async function SetlistPage({ params }: Props) {
  const { id } = await params
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: setlist, error: setlistError } = await supabase
    .from('setlists')
    .select('*')
    .eq('id', id)
    .single()

  if (setlistError || !setlist) {
    return <div className="p-8 text-center text-white">セットリストが見つかりません</div>
  }

  const { data: items, error: itemsError } = await supabase
    .from('setlist_items')
    .select(`
      id,
      call_id,
      songs (
        id,
        title,
        artists (name)
      ),
      call_charts (
        id,
        title,
        profiles!call_charts_author_id_fkey (
          username,
          handle
        )
      )
    `)
    .eq('setlist_id', id)
    .order('created_at', { ascending: true })

  if (itemsError) {
    return (
      <div className="container mx-auto px-4 py-8 text-white">
        <p className="text-red-400">Error: {itemsError.message}</p>
      </div>
    )
  }

  const shareUrl = `https://callguide.jp/setlists/${id}`
  const shareText = `${setlist.title} | Call Guide`

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl min-h-screen text-white">
      {/* ヘッダー */}
      <div className="mb-8 border-b border-gray-800 pb-8">
        <div className="text-sm text-gray-400 mb-2 font-bold tracking-wider">SETLIST</div>
        <h1 className="text-4xl font-bold mb-4 break-words leading-tight">{setlist.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{new Date(setlist.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{items?.length || 0} 曲</span>
          </div>

          <ShareButton title={setlist.title} text={shareText} url={shareUrl} />
        </div>
      </div>

      {/* リスト */}
      <div className="space-y-4">
        {items && items.length > 0 ? (
          items.map((item: any, index: number) => {
            const song = item.songs
            const chart = item.call_charts

            if (!song) return null

            const artistName = Array.isArray(song.artists)
              ? song.artists[0]?.name
              : song.artists?.name || 'Unknown Artist'

            const chartTitle = chart?.title || '名称未設定'

            let authorName = '名無し'
            if (chart?.profiles) {
              const profile = Array.isArray(chart.profiles) ? chart.profiles[0] : chart.profiles
              authorName = profile?.username || profile?.handle || '名無し'
            }

            return (
              <div key={item.id} className="group relative pl-4 md:pl-0">
                <div className="absolute left-[-10px] top-0 bottom-0 w-0.5 bg-gray-800 md:hidden"></div>

                <div className="flex items-center gap-4 bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 transition shadow-sm">
                  <div className="text-xl font-black text-gray-600 w-8 text-center shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold mb-1 truncate text-white">
                      {song.title}
                    </h2>

                    <p className="text-gray-400 text-sm truncate mb-1.5">{artistName}</p>

                    {chart && (
                      <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-900/50 py-1 px-2 rounded-md inline-flex max-w-full">
                        <span className="font-bold text-gray-300 truncate shrink">
                          {chartTitle}
                        </span>
                        <span className="text-gray-700 text-xs shrink-0">|</span>
                        <span className="text-gray-500 text-xs flex items-center gap-1 truncate">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                          </svg>
                          <span className="truncate">{authorName}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 ml-2">
                    {chart ? (
                      <Link
                        href={`/songs/${song.id}/${chart.id}`}
                        className="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-400 px-4 py-2 rounded-full text-sm font-bold transition border border-blue-900/50 whitespace-nowrap"
                      >
                        <span className="hidden md:inline">コール表</span>
                        <span className="md:hidden">表</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    ) : (
                      <Link
                        href={`/songs/${song.id}`}
                        className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 px-4 py-2 rounded-full text-sm font-bold transition border border-gray-700 whitespace-nowrap"
                      >
                        曲ページ
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-20 text-gray-500 border border-gray-800 border-dashed rounded-xl">
            <p>曲がまだ追加されていません</p>
          </div>
        )}
      </div>

      <div className="mt-16 text-center border-t border-gray-800 pt-8">
        <Link href="/mypage" className="text-gray-400 hover:text-white transition">
          マイページに戻る
        </Link>
      </div>
    </div>
  )
}
