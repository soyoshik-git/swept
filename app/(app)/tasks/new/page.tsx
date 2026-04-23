import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createTask } from "@/actions/tasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card } from "@/components/ui/Card";

export default async function NewTaskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">タスクを追加</h1>
      <Card className="p-4">
        <TaskForm onSubmit={createTask} submitLabel="追加する" members={members} />
      </Card>
    </div>
  );
}
