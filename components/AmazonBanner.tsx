"use client";

export default function AmazonBanner() {
  return (
    <a
      href="https://www.amazon.co.jp/music/unlimited/?tag=callguide2026-22"
      target="_blank"
      rel="noopener noreferrer"
      className="mb-4 block w-full overflow-hidden rounded-xl shadow-lg transition-all hover:opacity-95 hover:shadow-xl"
    >
      <div className="flex flex-col gap-2 bg-gradient-to-br from-[#00A8E1] to-[#232F3E] px-4 py-3 text-center md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-4 md:text-left">
        {/* 左側：テキスト情報 */}
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-end justify-center gap-2 leading-none text-white md:justify-start">
            <span className="text-lg font-bold tracking-tight">
              amazon music
            </span>
            <span className="pb-[2px] text-[10px] font-normal tracking-[0.2em] opacity-90">
              UNLIMITED
            </span>
          </div>

          <h2 className="mt-1 text-xs font-medium leading-tight text-white/95 md:text-sm">
            1億曲が広告なしで聴き放題。<span className="ml-1 inline-block opacity-80">オフライン再生対応。</span>
          </h2>
        </div>

        {/* 右側：ボタン（高さを抑える） */}
        <div className="w-full shrink-0 md:w-auto">
          <span className="block whitespace-nowrap rounded-full bg-white px-6 py-1.5 text-xs font-bold text-[#0084B1] shadow-sm transition-colors hover:bg-gray-50 md:inline-block md:text-sm">
            30日間無料体験
          </span>
        </div>
      </div>
    </a>
  );
}
