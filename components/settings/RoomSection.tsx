"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Home, Pencil, Check, X, Users, Crown } from "lucide-react";
import { updateRoomName } from "@/actions/rooms";

type Member = { id: string; name: string; isMe: boolean };

type Props = {
  roomName: string;
  members: Member[];
};

export function RoomSection({ roomName: initialRoomName, members }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [roomName, setRoomName] = useState(initialRoomName);
  const [tempRoomName, setTempRoomName] = useState(initialRoomName);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!tempRoomName.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", tempRoomName.trim());
      await updateRoomName(formData);
      setRoomName(tempRoomName.trim());
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setTempRoomName(roomName);
    setIsEditing(false);
  };

  const AVATAR_COLORS = [
    "from-primary to-accent",
    "from-pink-400 to-rose-500",
    "from-amber-400 to-orange-500",
    "from-violet-400 to-purple-500",
    "from-teal-400 to-cyan-500",
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" />
          ルーム設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">ルーム名</label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempRoomName}
                onChange={(e) => setTempRoomName(e.target.value)}
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
              <span className="text-foreground font-medium">{roomName}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
                aria-label="ルーム名を編集"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              メンバー
            </label>
            <span className="text-xs text-muted-foreground">{members.length}人</span>
          </div>
          <div className="space-y-2">
            {members.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[index % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-bold text-white`}
                >
                  {member.name.charAt(0)}
                </div>
                <span className="flex-1 text-foreground font-medium">
                  {member.name}
                  {member.isMe && (
                    <span className="ml-1 text-xs text-muted-foreground">（あなた）</span>
                  )}
                </span>
                {index === 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    <Crown className="w-3 h-3" />
                    オーナー
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
