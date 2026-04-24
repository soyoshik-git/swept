"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type RoomUser = { id: string; name: string; avatar_url: string | null };

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500",
  "bg-rose-500", "bg-amber-500", "bg-cyan-500",
];

function getColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  // ── 名前選択ログイン ──
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/auth/name-login")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .finally(() => setUsersLoading(false));
  }, []);

  async function handleNameLogin(user: RoomUser) {
    setLoginLoading(user.id);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/name-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const { hashedToken, error } = await res.json();
      if (error) throw new Error(error);

      // hashed_token で直接 verifyOtp → リダイレクト不要でログイン完了
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: hashedToken,
        type: "email",
      });
      if (verifyError) throw new Error(verifyError.message);
      router.push("/");
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "ログインに失敗しました");
      setLoginLoading(null);
    }
  }

  // ── メールログイン（折り畳み） ──
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setEmailError(error.message); }
    else { setSent(true); }
    setEmailLoading(false);
  }

  // ── 開発用ログイン ──
  const [devOpen, setDevOpen] = useState(false);
  const [devLoading, setDevLoading] = useState<"dev" | "guest" | null>(null);
  const [devError, setDevError] = useState("");

  async function handleQuickLogin(role: "dev" | "guest") {
    setDevLoading(role);
    setDevError("");
    try {
      const res = await fetch("/api/dev/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const { email: loginEmail, password, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail, password,
      });
      if (signInError) throw new Error(signInError.message);
      window.location.href = "/";
    } catch (e) {
      setDevError(e instanceof Error ? e.message : "ログインに失敗しました");
    } finally {
      setDevLoading(null);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-center space-y-2">
        <div className="text-4xl mb-3">📧</div>
        <p className="text-sm text-gray-700">
          <strong>{email}</strong> にログインリンクを送りました。
        </p>
        <p className="text-xs text-gray-400">メールを確認してください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── 名前選択 ── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">あなたはどなた？</p>
          <p className="text-xs text-gray-400 mt-0.5">名前をタップするとログインできます</p>
        </div>

        {loginError && (
          <p className="text-xs text-red-600 text-center">{loginError}</p>
        )}

        {usersLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">
            メンバーが見つかりません
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {users.map((user, i) => {
              const isLoading = loginLoading === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleNameLogin(user)}
                  disabled={loginLoading !== null}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-primary/40 hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-50 text-left"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 ${getColor(i)}`}>
                    {isLoading
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      : user.name.charAt(0)
                    }
                  </div>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {user.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── メールログイン（折り畳み） ── */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setEmailOpen((v) => !v)}
          className="w-full px-5 py-3 text-xs text-gray-400 hover:text-gray-500 flex items-center justify-between transition-colors"
        >
          <span>メールでログイン</span>
          <span>{emailOpen ? "▲" : "▼"}</span>
        </button>

        {emailOpen && (
          <form onSubmit={handleEmailSubmit} className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {emailError && <p className="text-xs text-red-600">{emailError}</p>}
            <Button type="submit" loading={emailLoading} className="w-full">
              ログインリンクを送る
            </Button>
          </form>
        )}
      </div>

      {/* ── 開発用（折り畳み） ── */}
      <div className="rounded-2xl bg-white shadow-sm border border-dashed border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setDevOpen((v) => !v)}
          className="w-full px-5 py-2.5 text-xs text-gray-300 hover:text-gray-400 flex items-center justify-between transition-colors"
        >
          <span>開発用</span>
          <span>{devOpen ? "▲" : "▼"}</span>
        </button>
        {devOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-dashed border-gray-100 space-y-2">
            {devError && <p className="text-xs text-red-600">{devError}</p>}
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
          </div>
        )}
      </div>
    </div>
  );
}
