"use client";

export default function AmazonBanner() {
  return (
    <a
      href="https://www.amazon.co.jp/music/unlimited/?tag=callguide2026-22"
      target="_blank"
      rel="noopener noreferrer"
      className="mb-6 block w-full overflow-hidden rounded-xl shadow-lg transition-all hover:opacity-95 hover:shadow-xl"
    >
      {/* 背景グラデーション */}
      <div className="flex flex-col gap-4 bg-gradient-to-br from-[#00A8E1] to-[#232F3E] p-4 text-center md:flex-row md:items-center md:justify-between md:px-6 md:py-5 md:text-left">
        {/* 左側：テキスト情報 */}
        <div className="min-w-0 flex-1">
          {/* ブランド名（公式風: amazon music + UNLIMITED） */}
          <div className="mb-1 inline-flex items-end justify-center gap-2 leading-none text-white md:justify-start">
            <span className="text-lg font-bold tracking-tight">
              amazon music
            </span>
            <span className="pb-[2px] text-xs font-medium tracking-[0.2em] opacity-90">
              UNLIMITED
            </span>
          </div>

          {/* キャッチコピー（コンパクト） */}
          <h2 className="mt-1 text-sm font-medium text-white/95 md:text-base">
            1億曲が広告なしで聴き放題。<span className="ml-1 inline-block opacity-80">オフライン再生対応。</span>
          </h2>
        </div>

        {/* 右側：ボタン（文言: 30日間無料体験） */}
        <div className="mt-4 w-full shrink-0 md:mt-0 md:w-auto">
          <span className="block whitespace-nowrap rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#0084B1] shadow-sm transition-colors hover:bg-gray-50 md:inline-block">
            30日間無料体験
          </span>
        </div>
      </div>
    </a>
  );
}
