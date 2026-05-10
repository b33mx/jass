import { supabase } from '../../lib/supabase.js';
import type { Task, TaskImage } from '../../models/task.model.js';
import type { TaskImageDto } from './task.types.js';

const TASK_SELECT = `
  task_id, task_date, task, detail, start_time, end_time, employee_ids, created_at,
  images:task_images(image_id, task_id, file_name, public_url, storage_path, module, created_at)
`.trim();

export async function insertTasks(
  records: Array<{ task_date: string; task: string; detail?: string; start_time?: string; end_time?: string; employee_ids: string; company_id: number }>
): Promise<{ task_id: number }[]> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(records)
    .select('task_id');
  if (error) throw new Error(error.message);
  return (data ?? []) as { task_id: number }[];
}

export async function insertTaskImages(
  records: Array<{ task_id: number } & TaskImageDto>
): Promise<void> {
  if (records.length === 0) return;
  const { error } = await supabase.from('task_images').insert(records);
  if (error) throw new Error(error.message);
}

export async function getTaskImagesByDate(date: string, companyId: number): Promise<TaskImage[]> {
  const { data: tasks, error: tErr } = await supabase
    .from('tasks')
    .select('task_id')
    .eq('task_date', date)
    .eq('company_id', companyId);
  if (tErr) throw new Error(tErr.message);

  const taskIds = (tasks ?? []).map((t: { task_id: number }) => t.task_id);
  if (taskIds.length === 0) return [];

  const { data, error } = await supabase
    .from('task_images')
    .select('image_id, task_id, file_name, public_url, storage_path, module, created_at')
    .in('task_id', taskIds);
  if (error) throw new Error(error.message);
  return (data ?? []) as TaskImage[];
}

export async function deleteTasksByDate(date: string, companyId: number): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('task_date', date)
    .eq('company_id', companyId);
  if (error) throw new Error(error.message);
}

export async function getTasksByDateRange(start: string, end: string, companyId: number): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('company_id', companyId)
    .gte('task_date', start)
    .lte('task_date', end)
    .order('task_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Task[];
}

export async function getTasksByDate(date: string, companyId: number): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('task_date', date)
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Task[];
}
