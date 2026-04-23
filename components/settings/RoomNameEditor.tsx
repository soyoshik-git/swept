"use client";

import { useState } from "react";
import { updateRoomName } from "@/actions/rooms";

export function RoomNameEditor({ initialName }: { initialName: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!draft.trim()) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("name", draft.trim());
      await updateRoomName(fd);
      setName(draft.trim());
      setEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setDraft(name);
    setError("");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div>
        <p className="text-xs text-gray-400 mb-1">ルーム名</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <button
            onClick={() => { setDraft(name); setEditing(true); }}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium shrink-0"
          >
            編集
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400">ルーム名</label>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
        autoFocus
        className="w-full rounded-lg border border-blue-400 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!draft.trim() || loading}
          className="flex-1 rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "保存中..." : "保存"}
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 rounded-lg border border-gray-200 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
