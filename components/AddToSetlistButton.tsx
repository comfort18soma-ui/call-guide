'use client'

import { useState, useEffect } from 'react'
import { supabaseClient as supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

// callId (数値) を受け取る設定
type Props = {
  songId: number
  callId: number
}

export default function AddToSetlistButton({ songId, callId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [setlists, setSetlists] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      if (user) fetchSetlists(user.id)
    }
    checkUser()
  }, [])

  const fetchSetlists = async (uid: string) => {
    const { data } = await supabase
      .from('setlists')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (data) setSetlists(data)
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim() || !userId) return
    setLoading(true)

    const { data: setlist, error: listError } = await supabase
      .from('setlists')
      .insert({ title: newTitle, user_id: userId })
      .select()
      .single()

    if (listError) {
      alert('作成に失敗しました')
      setLoading(false)
      return
    }

    await addToSetlist(setlist.id)
  }

  const addToSetlist = async (setlistId: string) => {
    setLoading(true)

    // call_id も一緒に保存する
    const { error } = await supabase
      .from('setlist_items')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        call_id: callId
      })

    setLoading(false)
    if (error) {
      console.error(error)
      alert('追加に失敗しました')
    } else {
      alert('追加しました！')
      setIsOpen(false)
      setNewTitle('')
    }
  }

  if (!userId) {
    return (
      <button onClick={() => router.push('/login')} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>リスト</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm font-bold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>リスト</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">このコールをリストに追加</h3>

            <div className="mb-6 border-b pb-6 border-gray-200">
              <p className="text-sm text-gray-500 mb-2">新しいセットリストを作成</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例: TIF2024予習"
                  className="border p-2 rounded flex-1"
                />
                <button
                  onClick={handleCreateAndAdd}
                  disabled={loading || !newTitle}
                  className="bg-black text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                >
                  作成&追加
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-2">既存のセットリストに追加</p>
              {setlists.length === 0 ? (
                <p className="text-gray-400 text-sm">作成済みのセットリストはありません</p>
              ) : (
                <ul className="space-y-2">
                  {setlists.map((list) => (
                    <li key={list.id}>
                      <button
                        onClick={() => addToSetlist(list.id)}
                        disabled={loading}
                        className="w-full text-left p-3 hover:bg-gray-100 rounded border border-gray-100 flex justify-between items-center"
                      >
                        <span className="font-bold">{list.title}</span>
                        <span className="text-blue-600 text-sm font-bold">追加</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button onClick={() => setIsOpen(false)} className="mt-6 w-full py-2 text-gray-500 font-bold hover:bg-gray-100 rounded">
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  )
}
