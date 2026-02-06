"use client";

import Link from "next/link";
import { ReactNode } from "react";

type HorizontalItem = {
  id: string | number;
  href: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null; // relative timeなど
  icon?: ReactNode;
};

type HorizontalScrollListProps = {
  title: string;
  items: HorizontalItem[];
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "たった今";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}時間前`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}日前`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}週間前`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}ヶ月前`;
  const year = Math.floor(day / 365);
  return `${year}年前`;
}

export function HorizontalScrollList({ title, items }: HorizontalScrollListProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mt-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex w-40 min-w-[10rem] max-w-[11rem] flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-xs transition-colors hover:border-zinc-600 hover:bg-zinc-900"
          >
            <div className="flex items-start gap-2">
              {item.icon && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                  {item.icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[12px] font-medium text-zinc-100">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
            {item.meta && (
              <p className="mt-2 text-[10px] text-zinc-500">
                {formatRelativeTime(item.meta)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

