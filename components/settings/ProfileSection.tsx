"use client";

import { useState, useTransition, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { User, Pencil, Check, X, Camera } from "lucide-react";
import { updateUserName, updateUserAvatar } from "@/actions/users";

type Props = {
  userName: string;
  avatarUrl: string | null;
  totalPoint: number;
  completionCount: number;
};

export function ProfileSection({ userName, avatarUrl: initialAvatarUrl, totalPoint, completionCount }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userName);
  const [tempName, setTempName] = useState(userName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isPending, startTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name.charAt(0) || "?";

  const handleSave = () => {
    if (!tempName.trim()) return;
    startTransition(async () => {
      await updateUserName(tempName.trim());
      setName(tempName.trim());
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setTempName(name);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const newUrl = await updateUserAvatar(formData);
      setAvatarUrl(newUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setIsUploadingAvatar(false);
      // 同じファイルを再選択できるようにリセット
      e.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          プロフィール
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {/* 隠しファイル入力（カメラ・フォトライブラリ両対応） */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="relative w-20 h-20 rounded-full overflow-hidden focus:outline-none active:scale-95 transition-transform"
              aria-label="アイコンを変更"
            >
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatarUrl}
                  alt="アバター"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
              {/* アップロード中オーバーレイ */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            {/* カメラアイコンバッジ */}
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-card border-2 border-border rounded-full flex items-center justify-center shadow-md hover:bg-muted active:scale-95 transition-all"
              aria-label="アイコンを変更"
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isUploadingAvatar ? "アップロード中..." : "タップしてアイコンを変更"}
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">表示名</label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 h-10"
                autoFocus
                disabled={isPending}
              />
              <button
                onClick={handleSave}
                disabled={isPending}
                className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                aria-label="保存"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95 transition-all"
                aria-label="キャンセル"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-foreground font-medium">{name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
                aria-label="名前を編集"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">{totalPoint.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">累計ポイント</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-foreground">{completionCount}</p>
            <p className="text-xs text-muted-foreground">完了タスク</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
