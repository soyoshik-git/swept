"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  setupCreateRoom,
  joinRoomByCode,
  setupFirstTask,
  setupCreateInviteToken,
} from "@/actions/setup";

type Step = 1 | 2 | 3;
type JoinMode = "create" | "join";

const STEPS = [
  { label: "ルーム" },
  { label: "タスク" },
  { label: "招待" },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [joinMode, setJoinMode] = useState<JoinMode>("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 - create
  const [roomName, setRoomName] = useState("");
  // Step 1 - join
  const [roomCode, setRoomCode] = useState("");

  // Step 2
  const [taskName, setTaskName] = useState("");
  const [taskSpace, setTaskSpace] = useState("");
  const [basePoint, setBasePoint] = useState(3);
  const [frequencyDays, setFrequencyDays] = useState(7);

  // Step 3
  const [inviteUrl, setInviteUrl] = useState("");
  const [roomCodeDisplay, setRoomCodeDisplay] = useState("");
  const [copied, setCopied] = useState<"url" | "code" | null>(null);

  async function handleStep1() {
    setLoading(true);
    setError("");
    try {
      if (joinMode === "create") {
        if (!roomName.trim()) return;
        await setupCreateRoom(roomName.trim());
      } else {
        if (roomCode.length !== 5) return;
        await joinRoomByCode(roomCode);
        // コードで参加の場合はタスク追加をスキップしてダッシュボードへ
        router.push("/");
        return;
      }
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (!taskName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await setupFirstTask({
        name: taskName.trim(),
        space: taskSpace.trim(),
        base_point: basePoint,
        frequency_days: frequencyDays,
      });
      const token = await setupCreateInviteToken();
      setInviteUrl(`${window.location.origin}/invite?token=${token}`);
      // ルームコードを取得
      const res = await fetch("/api/room/code");
      const { code } = await res.json();
      setRoomCodeDisplay(code ?? "");
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(type: "url" | "code") {
    const text = type === "url" ? inviteUrl : roomCodeDisplay;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🧹</div>
          <h1 className="text-2xl font-bold text-gray-900">Swept</h1>
          <p className="text-sm text-gray-500 mt-1">はじめに設定をしましょう</p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const num = (i + 1) as Step;
            const active = num === step;
            const done = num < step;
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    {done ? "✓" : num}
                  </div>
                  <span className={`text-xs ${active ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mb-4 mx-1 ${num < step ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* カード */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

          {/* ── Step 1: ルーム ── */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ルームを設定しましょう</h2>
                <p className="text-sm text-gray-500 mt-1">新しく作るか、既存のルームに参加できます</p>
              </div>

              {/* タブ切替 */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  type="button"
                  onClick={() => { setJoinMode("create"); setError(""); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    joinMode === "create" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  🏠 新しく作る
                </button>
                <button
                  type="button"
                  onClick={() => { setJoinMode("join"); setError(""); }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    joinMode === "join" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  🔑 コードで参加
                </button>
              </div>

              {joinMode === "create" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ルーム名</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                    placeholder="例）渋谷シェアハウス、2丁目の家"
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ルームコード（5桁）</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                    placeholder="12345"
                    maxLength={5}
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">ルームメンバーにコードを教えてもらってください</p>
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                onClick={handleStep1}
                disabled={
                  loading ||
                  (joinMode === "create" ? !roomName.trim() : roomCode.length !== 5)
                }
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {loading ? "処理中..." : joinMode === "join" ? "参加する" : "次へ →"}
              </button>
            </>
          )}

          {/* ── Step 2: タスク ── */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900">最初の掃除タスクを追加しましょう</h2>
                <p className="text-sm text-gray-500 mt-1">あとで追加・変更できます。まずは1つだけ。</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="例）トイレ掃除、ゴミ出し、床掃除"
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">場所（任意）</label>
                  <input
                    type="text"
                    value={taskSpace}
                    onChange={(e) => setTaskSpace(e.target.value)}
                    placeholder="例）1階トイレ、リビング"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">難易度ポイント</label>
                    <select
                      value={basePoint}
                      onChange={(e) => setBasePoint(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1（簡単）</option>
                      <option value={2}>2</option>
                      <option value={3}>3（普通）</option>
                      <option value={5}>5</option>
                      <option value={8}>8（大変）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">理想の頻度</label>
                    <select
                      value={frequencyDays}
                      onChange={(e) => setFrequencyDays(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>毎日</option>
                      <option value={3}>3日に1回</option>
                      <option value={7}>週1回</option>
                      <option value={14}>2週に1回</option>
                      <option value={30}>月1回</option>
                    </select>
                  </div>
                </div>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                onClick={handleStep2}
                disabled={!taskName.trim() || loading}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {loading ? "保存中..." : "次へ →"}
              </button>
              <button onClick={() => setStep(1)} className="w-full text-sm text-gray-400 hover:text-gray-600">
                ← 戻る
              </button>
            </>
          )}

          {/* ── Step 3: 招待 ── */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900">メンバーを招待しましょう 🎉</h2>
                <p className="text-sm text-gray-500 mt-1">リンクかコードを共有してください。スキップもできます。</p>
              </div>

              <div className="space-y-3">
                {/* ルームコード */}
                {roomCodeDisplay && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
                    <p className="text-xs text-blue-500 mb-1">ルームコード</p>
                    <p className="text-4xl font-mono font-bold text-blue-700 tracking-widest">
                      {roomCodeDisplay}
                    </p>
                    <button
                      onClick={() => handleCopy("code")}
                      className={`mt-2 text-xs font-medium transition-colors ${
                        copied === "code" ? "text-green-600" : "text-blue-500 hover:text-blue-700"
                      }`}
                    >
                      {copied === "code" ? "✅ コピーしました" : "コードをコピー"}
                    </button>
                  </div>
                )}

                {/* 招待リンク */}
                {inviteUrl && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">招待リンク（7日間有効）</p>
                    <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 break-all">
                      {inviteUrl}
                    </div>
                    <button
                      onClick={() => handleCopy("url")}
                      className={`mt-1.5 w-full rounded-lg border py-2 text-sm font-medium transition-colors ${
                        copied === "url"
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {copied === "url" ? "✅ コピーしました！" : "📋 招待リンクをコピー"}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push("/")}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
              >
                ダッシュボードへ →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
