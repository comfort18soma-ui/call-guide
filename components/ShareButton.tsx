'use client'

type Props = {
  title: string
  text?: string
  url: string
}

export default function ShareButton({ title, text, url }: Props) {
  const handleShare = async () => {
    const shareData = {
      title: title,
      text: text || title,
      url: url,
    }

    if (navigator.share && (navigator.canShare?.(shareData) ?? true)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share canceled or failed', err)
      }
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`
      window.open(twitterUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      onClick={handleShare}
      className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center shadow-sm"
      aria-label="シェアする"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    </button>
  )
}
