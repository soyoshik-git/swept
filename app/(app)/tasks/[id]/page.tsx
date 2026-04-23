import { createClient } from "@/lib/supabase/server";
import { updateTask, archiveTask } from "@/actions/tasks";
import { TaskForm } from "@/components/tasks/TaskForm";
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

  async function handleUpdate(data: CreateTaskInput) {
    "use server";
    await updateTask(id, data);
  }

  async function handleArchive() {
    "use server";
    await archiveTask(id);
    redirect("/tasks");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">タスクを編集</h1>
      <Card className="p-4">
        <TaskForm
          initialValues={task}
          members={members}
          onSubmit={handleUpdate}
          submitLabel="保存する"
        />
      </Card>

      <form action={handleArchive}>
        <button
          type="submit"
          className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          このタスクをアーカイブする
        </button>
      </form>
    </div>
  );
}
