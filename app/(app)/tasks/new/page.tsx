import { createTask } from "@/actions/tasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card } from "@/components/ui/Card";

export default function NewTaskPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">タスクを追加</h1>
      <Card className="p-4">
        <TaskForm onSubmit={createTask} submitLabel="追加する" />
      </Card>
    </div>
  );
}
