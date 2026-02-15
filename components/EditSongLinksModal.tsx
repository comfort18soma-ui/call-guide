'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { useUserRole } from '@/hooks/useUserRole'
import { convertAmazonLink, convertAppleMusicLink } from '@/lib/affiliate'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const DEV_ADMIN_ID = process.env.NEXT_PUBLIC_DEV_ADMIN_ID ?? ''

export type EditSongLinksSong = {
  id: number
  youtube_url: string | null
  apple_music_url: string | null
  amazon_music_url: string | null
}

type Props = {
  song: EditSongLinksSong
}

function isAdmin(role: string | null, userId: string | null): boolean {
  if (role === 'admin') return true
  if (DEV_ADMIN_ID && userId === DEV_ADMIN_ID) return true
  return false
}

export default function EditSongLinksModal({ song }: Props) {
  const [open, setOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [appleMusicUrl, setAppleMusicUrl] = useState('')
  const [amazonMusicUrl, setAmazonMusicUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { role, loading } = useUserRole()

  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!open) return
    setYoutubeUrl(song.youtube_url ?? '')
    setAppleMusicUrl(song.apple_music_url ?? '')
    setAmazonMusicUrl(song.amazon_music_url ?? '')
    setError(null)
  }, [song, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const yt = youtubeUrl.trim() || null
      const apple = appleMusicUrl.trim()
      const amazon = amazonMusicUrl.trim()
      const appleUrl = apple ? (convertAppleMusicLink(apple) ?? apple) : null
      // Amazon Music URL: convertAmazonLink で tag=callguide2026-22 を追加（既存クエリは維持）
      const amazonUrl = amazon ? (convertAmazonLink(amazon) ?? amazon) : null

      const { error: updateError } = await supabase
        .from('songs')
        .update({
          youtube_url: yt,
          apple_music_url: appleUrl,
          amazon_music_url: amazonUrl,
        })
        .eq('id', song.id)

      if (updateError) throw updateError
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null
  if (!isAdmin(role, userId)) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-gray-500 hover:text-white p-2"
          title="音楽リンクを編集（管理者のみ）"
          aria-label="音楽リンクを編集"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">音楽リンクを編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-youtube" className="text-zinc-300">
              YouTube URL
            </Label>
            <Input
              id="edit-youtube"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-apple" className="text-zinc-300">
              Apple Music URL
            </Label>
            <Input
              id="edit-apple"
              type="url"
              value={appleMusicUrl}
              onChange={(e) => setAppleMusicUrl(e.target.value)}
              placeholder="https://music.apple.com/..."
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-amazon" className="text-zinc-300">
              Amazon Music URL
            </Label>
            <Input
              id="edit-amazon"
              type="url"
              value={amazonMusicUrl}
              onChange={(e) => setAmazonMusicUrl(e.target.value)}
              placeholder="https://music.amazon.co.jp/..."
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              disabled={saving}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-zinc-700"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
