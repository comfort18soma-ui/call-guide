'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { supabaseClient as supabase } from '@/lib/supabaseClient'

type Props = {
  itemId: string
  ownerId: string
  compact?: boolean
}

export default function DeleteSongButton({ itemId, ownerId, compact }: Props) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    checkUser()
  }, [])

  const handleDelete = async () => {
    if (!confirm('この曲をセットリストから削除しますか？')) return
    setIsDeleting(true)

    const { error } = await supabase
      .from('setlist_items')
      .delete()
      .eq('id', itemId)

    setIsDeleting(false)

    if (error) {
      alert('削除に失敗しました')
      return
    }
    router.refresh()
  }

  if (currentUserId !== ownerId) return null

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className={`flex items-center justify-center rounded-full text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition disabled:opacity-50 shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
      title="セットリストから削除"
      aria-label="セットリストから削除"
    >
      <Trash2 className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
    </button>
  )
}
