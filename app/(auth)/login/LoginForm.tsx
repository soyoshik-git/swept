"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const DEV_LOGIN_ENABLED =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_LOGIN_ENABLED === "true";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState<"dev" | "guest" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  async function handleSeed() {
    setDevLoading("dev");
    setError("");
    try {
      const res = await fetch("/api/dev/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "seed failed");
      alert(`シード完了！ users:${json.users} tasks:${json.tasks} completions:${json.completions}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "シードに失敗しました");
    } finally {
      setDevLoading(null);
    }
  }

  async function handleQuickLogin(role: "dev" | "guest") {
    setDevLoading(role);
    setError("");
    try {
      const res = await fetch("/api/dev/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const { email: loginEmail, password, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (signInError) throw new Error(signInError.message);

      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
    } finally {
      setDevLoading(null);
    }
  }

  const [devOpen, setDevOpen] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 text-center">
        <div className="text-4xl mb-3">📧</div>
        <p className="text-sm text-gray-700">
          <strong>{email}</strong> にログインリンクを送りました。
          <br />
          メールを確認してください。
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">
        ログインリンクを送る
      </Button>

      {DEV_LOGIN_ENABLED && (
        <div className="pt-2 border-t border-dashed border-gray-200">
          <button
            type="button"
            onClick={() => setDevOpen((v) => !v)}
            className="w-full text-xs text-gray-300 hover:text-gray-400 py-1 transition-colors"
          >
            {devOpen ? "▲ 開発用" : "▼ 開発用"}
          </button>
          {devOpen && (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("dev")}
                  disabled={devLoading !== null}
                  className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                >
                  {devLoading === "dev" ? "..." : "⚙️ Dev"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("guest")}
                  disabled={devLoading !== null}
                  className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                >
                  {devLoading === "guest" ? "..." : "👤 Guest"}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSeed}
                disabled={devLoading !== null}
                className="w-full rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                {devLoading !== null ? "..." : "🌱 ダミーデータ投入"}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
