"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, BookOpen, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/calls", icon: List, label: "コール表" },
    { href: "/dictionary", icon: BookOpen, label: "MIX辞典" },
    { href: "/board", icon: MessageCircle, label: "掲示板" },
    { href: "/mypage", icon: User, label: "マイページ" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm safe-area-inset-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-colors active:scale-95",
                isActive
                  ? "text-fuchsia-400"
                  : "text-zinc-500 active:text-zinc-300"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
