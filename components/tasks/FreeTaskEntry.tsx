"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { FreeTaskModal } from "./FreeTaskModal";

export function FreeTaskEntry() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">その他</p>
            <p className="text-xs text-muted-foreground mt-0.5">フリータスク・10〜40pt</p>
          </div>
        </div>
        <span className="text-xs text-primary font-medium border border-primary/30 rounded-full px-2.5 py-0.5">
          完了する
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <FreeTaskModal onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
