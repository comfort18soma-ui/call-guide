"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wrench, SquarePlus } from "lucide-react";
import { UserStatus } from "@/components/UserStatus";
import { useUserRole } from "@/hooks/useUserRole";

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function Header() {
  const { role } = useUserRole();
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;
    if (isIOS()) {
      setShowIOSHint(true);
      setTimeout(() => setShowIOSHint(false), 4000);
      return;
    }
    if (deferredPrompt) {
      (deferredPrompt as { prompt?: () => Promise<void> }).prompt?.();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-[10px] font-bold text-white">
            CG
          </span>
          <span className="text-sm font-semibold tracking-tight">
            CallGuide
          </span>
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700/80 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200 active:scale-95"
              aria-label="アプリをインストール"
              title="ホーム画面に追加"
            >
              <SquarePlus className="h-4 w-4" />
            </button>
          )}
          <UserStatus />
        </div>
        {role === "admin" && (
          <Link
            href="/admin/requests"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="管理画面へ"
          >
            <Wrench className="h-5 w-5" />
          </Link>
        )}
      </div>
      {showIOSHint && (
        <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-center text-xs text-zinc-300">
          📱 共有ボタン →「ホーム画面に追加」でアプリのように使えます
        </div>
      )}
    </header>
  );
}
