import { supabase } from '../../lib/supabase.js';
import type { Task } from '../../models/task.model.js';

const TASK_FIELDS = 'task_id, task_date, task, detail, employee_ids, created_at';

export async function insertTasks(
  records: Array<{ task_date: string; task: string; detail?: string; employee_ids: string }>
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(records)
    .select(TASK_FIELDS);
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}
