'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient as supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  setlistId: string
  initialDescription: string | null
  ownerId: string
}

export default function SetlistDescription({ setlistId, initialDescription, ownerId }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(initialDescription ?? '')
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

  useEffect(() => {
    if (!isEditing) {
      setDescription(initialDescription ?? '')
    }
  }, [initialDescription, isEditing])

  const isOwner = currentUserId === ownerId

  const handleSave = async () => {
    setIsLoading(true)
    const { error } = await supabase
      .from('setlists')
      .update({ description: description.trim() || null })
      .eq('id', setlistId)
    setIsLoading(false)
    if (error) {
      alert('保存に失敗しました')
      return
    }
    setIsEditing(false)
    router.refresh()
  }

  const handleCancel = () => {
    setDescription(initialDescription ?? '')
    setIsEditing(false)
  }

  if (!isOwner && !(initialDescription ?? '').trim()) {
    return null
  }

  if (isEditing) {
    return (
      <div className="mb-6">
        <label htmlFor="setlist-description" className="block text-xs font-medium text-gray-400 mb-1">
          備考
        </label>
        <Textarea
          id="setlist-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="セットリストの説明やメモを入力"
          rows={3}
          className="w-full text-sm text-gray-200 bg-[#111] border-gray-700 rounded-lg resize-y mb-2"
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="rounded-lg"
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-lg border-gray-600 text-gray-300"
          >
            キャンセル
          </Button>
        </div>
      </div>
    )
  }

  const hasDescription = (initialDescription ?? '').trim().length > 0

  if (hasDescription) {
    return (
      <div className="mb-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-300 whitespace-pre-wrap flex-1 min-w-0">
            {initialDescription}
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-500 hover:text-gray-300 shrink-0"
            >
              編集
            </button>
          )}
        </div>
      </div>
    )
  }

  if (isOwner) {
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm text-gray-500 hover:text-gray-400 border border-dashed border-gray-700 rounded-lg px-3 py-2 w-full text-left transition"
        >
          + 備考を追加
        </button>
      </div>
    )
  }

  return null
}
