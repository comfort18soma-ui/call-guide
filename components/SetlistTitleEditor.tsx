'use client'

import { useState, useEffect } from 'react'
import { supabaseClient as supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
  initialTitle: string
  ownerId: string
}

export default function SetlistTitleEditor({ id, initialTitle, ownerId }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    checkUser()
  }, [])

  const handleSave = async () => {
    if (!title.trim()) return
    setIsLoading(true)

    const { error } = await supabase
      .from('setlists')
      .update({ title: title.trim() })
      .eq('id', id)

    setIsLoading(false)

    if (error) {
      alert('更新に失敗しました')
    } else {
      setIsEditing(false)
      router.refresh()
    }
  }

  const isOwner = currentUserId === ownerId

  if (isEditing) {
    return (
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#222] border border-blue-500 text-white text-3xl md:text-4xl font-bold p-2 rounded mb-2 outline-none"
          autoFocus
        />
        <div className="flex gap-2 text-sm font-bold">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded transition disabled:opacity-50"
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setTitle(initialTitle)
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded transition"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 flex items-start gap-3 group">
      <h1 className="text-3xl md:text-4xl font-bold break-words leading-tight">
        {title}
      </h1>

      {isOwner && (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-1.5 text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition"
          title="タイトルを編集"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </button>
      )}
    </div>
  )
}
