"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/types/database";

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", user.id)
    .single();
  if (!member?.room_id) throw new Error("Room not found");

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ ...data, room_id: member.room_id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/tasks");
  return task;
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput,
): Promise<Task> {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  return task;
}

export async function archiveTask(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/tasks");
}
