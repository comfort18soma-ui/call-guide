"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type UserRole = "admin" | "user" | null;

interface UseUserRoleReturn {
  role: UserRole;
  email: string | null;
  loading: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // 現在のセッションを取得
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRole(null);
          setEmail(null);
          setLoading(false);
          return;
        }

        // メールアドレスを設定
        setEmail(user.email ?? null);

        // profilesテーブルからroleを取得
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Failed to fetch user role:", error);
          setRole(null);
        } else {
          // roleが'admin'または'user'の場合のみ設定
          const userRole = data?.role;
          if (userRole === "admin" || userRole === "user") {
            setRole(userRole);
          } else {
            setRole(null);
          }
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setRole(null);
        setEmail(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchUserRole();
  }, []);

  return { role, email, loading };
}
