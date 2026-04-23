"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Bell, Clock, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { unlinkLineGroup } from "@/actions/rooms";
import { useTransition } from "react";

type Props = {
  lineGroupId: string | null;
};

export function NotificationSection({ lineGroupId }: Props) {
  const [notifications, setNotifications] = useState({
    taskReminder: true,
    weeklyReport: true,
  });
  const [isPending, startTransition] = useTransition();

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUnlink = () => {
    startTransition(async () => {
      await unlinkLineGroup();
    });
  };

  const items = [
    {
      key: "taskReminder" as const,
      icon: Clock,
      title: "タスクリマインダー",
      description: "タスクが期限に近づいたらLINEで通知",
    },
    {
      key: "weeklyReport" as const,
      icon: Bell,
      title: "週間レポート",
      description: "毎週月曜日に掃除状況をまとめてLINEへ送信",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          通知設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* LINE連携ステータス */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#06C755]/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-[#06C755]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">LINE連携</p>
            {lineGroupId ? (
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-accent" />
                <p className="text-xs text-accent">グループと連携済み</p>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <XCircle className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">未連携</p>
              </div>
            )}
          </div>
          {lineGroupId ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-8"
              onClick={handleUnlink}
              disabled={isPending}
            >
              解除
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="text-xs h-8 text-[#06C755] border-[#06C755]/30 hover:bg-[#06C755]/10">
              連携方法
            </Button>
          )}
        </div>

        {!lineGroupId && (
          <div className="px-3 pb-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mb-2">
            LINEグループに <span className="font-medium text-foreground">Swept Bot</span> を追加すると自動で連携されます。通知はグループ全員に送信されます。
          </div>
        )}

        {/* トグル */}
        {items.map((item, index) => (
          <div
            key={item.key}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
              index !== items.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={notifications[item.key]}
              onCheckedChange={() => toggle(item.key)}
              disabled={!lineGroupId}
            />
          </div>
        ))}

        {!lineGroupId && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            LINE連携後に通知を設定できます
          </p>
        )}
      </CardContent>
    </Card>
  );
}
