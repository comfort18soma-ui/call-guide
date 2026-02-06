"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Calendar as CalendarIcon, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBoardCategoryLabel } from "@/lib/board-categories";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type CalendarEventRow = {
  event_date: string;
  event_time: string | null;
  category: string | null;
};

type EventsByDate = Record<string, CalendarEventRow[]>;

const categoryDotClass = (category: string | null) => {
  switch (category) {
    case "ground":
      return "bg-red-500";
    case "underground":
      return "bg-blue-500";
    case "mens_underground":
      return "bg-purple-500";
    case "other":
      return "bg-zinc-500";
    default:
      return "bg-zinc-700";
  }
};

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function BoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [eventsByDate, setEventsByDate] = useState<EventsByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ? { id: session.user.id } : null);
    };
    void checkSession();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-based

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
      }),
    [currentMonth],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        const startStr = formatDateKey(start);
        const endStr = formatDateKey(end);

        const { data, error } = await supabase
          .from("bulletin_boards")
          .select("event_date, event_time, category")
          .eq("status", "approved")
          .gte("event_date", startStr)
          .lte("event_date", endStr)
          .order("event_time", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) throw error;

        const map: EventsByDate = {};
        for (const row of (data as CalendarEventRow[]) ?? []) {
          const key = row.event_date;
          if (!map[key]) map[key] = [];
          map[key].push(row);
        }
        setEventsByDate(map);
      } catch (err) {
        console.error(err);
        setError("イベントの取得に失敗しました");
        setEventsByDate({});
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [year, month]);

  const goPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const weeks = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstWeekday = firstDayOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }

    // Pad to complete weeks (multiples of 7)
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeksArr: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeksArr.push(cells.slice(i, i + 7));
    }
    return weeksArr;
  }, [year, month]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-950/30 via-black to-fuchsia-950/20 pb-24 text-zinc-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-rose-400" />
            <h1 className="text-xl font-bold tracking-tight">掲示板</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            カレンダーから募集日を確認して、気になる日付をタップしてください。
          </p>
        </header>

        {/* 凡例 */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 sm:justify-start">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
            地上
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />
            地下
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" aria-hidden />
            メン地下
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-500" aria-hidden />
            その他
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl bg-zinc-900/80 p-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800"
            onClick={goPrevMonth}
          >
            ＜ 先月
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
            <CalendarIcon className="h-4 w-4 text-rose-400" />
            <span>{monthLabel}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800"
            onClick={goNextMonth}
          >
            来月 ＞
          </Button>
        </div>

        <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-zinc-400">
          <span>日</span>
          <span>月</span>
          <span>火</span>
          <span>水</span>
          <span>木</span>
          <span>金</span>
          <span>土</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">読み込み中...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-2">
            {weeks.map((week, wi) =>
              week.map((date, di) => {
                if (!date) {
                  return <div key={`${wi}-${di}`} className="h-16 rounded-xl bg-transparent" />;
                }
                const key = formatDateKey(date);
                const events = eventsByDate[key] ?? [];
                const isToday = (() => {
                  const now = new Date();
                  return (
                    now.getFullYear() === date.getFullYear() &&
                    now.getMonth() === date.getMonth() &&
                    now.getDate() === date.getDate()
                  );
                })();

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => router.push(`/board/${key}`)}
                    className={`flex h-16 flex-col rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-1 text-left text-xs transition hover:border-rose-400 hover:bg-zinc-900
                      ${isToday ? "border-rose-500 bg-zinc-900" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-100">
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {events.map((e, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full ${categoryDotClass(e.category)}`}
                        />
                      ))}
                    </div>
                  </button>
                );
              }),
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (!user) {
            router.push("/login");
            return;
          }
          router.push("/board/create");
        }}
        className="fixed bottom-20 right-4 flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-white shadow-lg shadow-rose-500/40 transition hover:bg-rose-400 active:scale-95"
        aria-label="募集する"
      >
        <Plus className="h-6 w-6 shrink-0" />
        <span className="text-sm font-semibold">募集する</span>
      </button>
    </main>
  );
}
