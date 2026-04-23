import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function SettingsHeader() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-95 transition-all"
          aria-label="戻る"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">設定</h1>
      </div>
    </header>
  );
}
