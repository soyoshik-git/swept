"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { overlay, slideUp, sheetSpring, fastFade } from "@/lib/animate";

export function TaskMemoButton({ memo, taskName }: { memo: string; taskName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();   // Link のナビゲーションをキャンセル
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
        aria-label="メモを見る"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="absolute inset-0 bg-black/40"
              variants={overlay}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={fastFade}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative rounded-t-2xl bg-white px-5 pt-4 pb-10"
              variants={slideUp}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={sheetSpring}
            >
              {/* ハンドル */}
              <div className="flex justify-center mb-4">
                <div className="w-9 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-gray-900">{taskName}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {memo}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
