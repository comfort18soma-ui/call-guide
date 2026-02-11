'use client'

import { useState, useEffect } from 'react'
import { supabaseClient as supabase } from '@/lib/supabaseClient'

type Props = {
  callId: number
  initialCount: number
}

export default function HeartButton({ callId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkLike = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('likes').select('id').eq('call_id', callId).eq('user_id', user.id).single()
      if (data) setIsLiked(true)
    }
    checkLike()
  }, [callId])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLoading) return
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('いいねするにはログインが必要です')
      setIsLoading(false)
      return
    }

    if (isLiked) {
      const { error } = await supabase.from('likes').delete().eq('call_id', callId).eq('user_id', user.id)
      if (!error) {
        setCount((prev) => Math.max(0, prev - 1))
        setIsLiked(false)
      }
    } else {
      const { error } = await supabase.from('likes').insert({ call_id: callId, user_id: user.id })
      if (!error) {
        setCount((prev) => prev + 1)
        setIsLiked(true)
      }
    }
    setIsLoading(false)
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition text-sm font-bold border ${
        isLiked ? 'bg-pink-900/30 text-pink-400 border-pink-900/50' : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700'
      }`}
    >
      <span className={isLiked ? 'text-pink-400' : ''}>♥</span>
      <span>{count}</span>
    </button>
  )
}
