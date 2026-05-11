import { createClient } from "@/lib/supabase/server";
import { updateTask } from "@/actions/tasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import { ArchiveTaskButton } from "@/components/tasks/ArchiveTaskButton";
import { Card } from "@/components/ui/Card";
import { redirect, notFound } from "next/navigation";
import type { CreateTaskInput } from "@/types/database";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!task) notFound();

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();

  const { data: roomMembers } = await supabase
    .from("users")
    .select("id, name")
    .eq("room_id", member?.room_id ?? "");

  const members = (roomMembers ?? []).map((m) => ({ id: m.id, name: m.name }));

  // 既存タスクの場所一覧
  const { data: tasksWithSpace } = await supabase
    .from("tasks")
    .select("space")
    .eq("room_id", member?.room_id ?? "")
    .not("space", "is", null);

  const existingSpaces = Array.from(
    new Set((tasksWithSpace ?? []).map((t) => t.space).filter(Boolean) as string[])
  );

  async function handleUpdate(data: CreateTaskInput) {
    "use server";
    await updateTask(id, data);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">タスクを編集</h1>
      <Card className="p-4">
        <TaskForm
          initialValues={task}
          members={members}
          existingSpaces={existingSpaces}
          onSubmit={handleUpdate}
          submitLabel="保存する"
        />
      </Card>

      <ArchiveTaskButton taskId={id} />
    </div>
  );
}
