'use client'

import Link from 'next/link'
import HeartButton from '@/components/HeartButton'

type Props = {
  charts: any[]
  songId: string
}

export default function CallList({ charts, songId }: Props) {
  if (!charts || charts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl">
        <p className="mb-2">まだコール表がありません</p>
        <Link href={`/songs/${songId}/add`} className="text-blue-400 hover:underline text-sm">
          最初のコールを作成する
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {charts.map((chart) => {
        const profile = chart.profiles
        const authorName = (Array.isArray(profile) ? profile[0] : profile)?.username || (Array.isArray(profile) ? profile[0] : profile)?.handle || 'Unknown'
        const likeCount = chart.like_count ?? 0

        return (
          <Link
            href={`/songs/${songId}/${chart.id}`}
            key={chart.id}
            className="block bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition">
                  {chart.title || '（タイトルなし）'}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{authorName}</span>
                  <span>•</span>
                  <span>{new Date(chart.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                <HeartButton callId={Number(chart.id)} initialCount={likeCount} />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
