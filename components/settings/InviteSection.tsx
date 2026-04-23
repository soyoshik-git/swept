"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserPlus, Copy, Check, Share2, QrCode, X } from "lucide-react";
import { createInviteToken } from "@/actions/rooms";
import Image from "next/image";

type Props = {
  roomCode: string;
  origin: string;
};

export function InviteSection({ roomCode, origin }: Props) {
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [isPending, startTransition] = useTransition();

  const inviteLink = inviteToken
    ? `${origin}/invite?token=${inviteToken}`
    : `${origin}/setup`; // QR用のデフォルトURL（ルームコード入力画面）
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    inviteToken ? inviteLink : `${origin}/setup?code=${roomCode}`
  )}`;

  const displayCode = roomCode || "—";

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    if (!inviteToken) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateInvite = () => {
    startTransition(async () => {
      const token = await createInviteToken();
      setInviteToken(token);
    });
  };

  const handleShare = async () => {
    const url = inviteToken ? inviteLink : `${origin}/setup?code=${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sweptに参加しよう", url });
      } catch {
        await navigator.clipboard.writeText(url);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            メンバー招待
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 招待コード */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">招待コード</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted/50 rounded-lg font-mono text-center text-foreground font-bold tracking-widest text-lg">
                {displayCode}
              </div>
              <button
                onClick={handleCopyCode}
                className={`p-3 rounded-lg transition-all active:scale-95 ${
                  copied
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
                aria-label="コピー"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* QR / 共有ボタン */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 flex-col gap-1" onClick={() => setShowQr(true)}>
              <QrCode className="w-5 h-5" />
              <span className="text-xs">QRコード表示</span>
            </Button>
            <Button
              className="h-12 flex-col gap-1"
              onClick={inviteToken ? handleShare : handleGenerateInvite}
              disabled={isPending}
              loading={isPending}
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs">{inviteToken ? "共有する" : "招待リンク生成"}</span>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            招待コードは7日間有効です。期限切れの場合は再生成してください。
          </p>

          {/* 生成済み招待リンク */}
          {inviteToken && (
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-medium text-muted-foreground">生成された招待リンク</label>
              <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground break-all font-mono">
                {inviteLink}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-1" />コピー
                </Button>
                <Button size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" />共有
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QRコードモーダル */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 mx-4 w-full max-w-xs shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">QRコード</h3>
              <button
                onClick={() => setShowQr(false)}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="招待QRコード"
                  width={240}
                  height={240}
                  className="rounded"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">ルームコード</p>
                <p className="text-2xl font-bold font-mono tracking-widest text-foreground">
                  {displayCode}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                QRコードを読み取るか、コードを入力して参加できます
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
