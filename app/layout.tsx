import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "クリーン当番",
  description: "ルームシェア向け掃除管理アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
