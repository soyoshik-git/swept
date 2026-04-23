"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
        if (error) {
          router.push("/login?error=auth");
          return;
        }
        // タスクが0件ならセットアップへ
        const { count } = await supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);
        router.push((count ?? 0) === 0 ? "/setup" : "/");
      });
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">ログイン中...</p>
    </div>
  );
}
