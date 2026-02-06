"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function UserStatus() {
  const { role, email, loading } = useUserRole();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error("Failed to sign out:", error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return null;
  }

  // 未ログインの場合はログインボタンを表示
  if (!role) {
    return (
      <Link href="/login">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-full border border-zinc-800 bg-transparent px-3 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
        >
          ログイン
        </Button>
      </Link>
    );
  }

  const badgeContent = role === "admin" ? "👑 管理者" : "🟢 ログイン中";
  const badgeClassName =
    role === "admin"
      ? "border-red-500/50 bg-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/30 transition-colors"
      : "border-emerald-500/50 bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30 transition-colors";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge variant={role === "admin" ? "destructive" : "outline"} className={badgeClassName}>
          {badgeContent}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-zinc-800 bg-zinc-950">
        {email && (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-xs font-normal text-zinc-400">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
          </>
        )}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loggingOut}
          className="cursor-pointer text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100 data-[disabled]:opacity-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {loggingOut ? "ログアウト中..." : "ログアウト"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
