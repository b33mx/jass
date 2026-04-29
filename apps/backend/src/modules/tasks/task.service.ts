import { supabase } from '../../lib/supabase.js';
import {
  insertTasks,
  insertTaskImages,
  getTasksByDate,
  deleteTasksByDate,
  getTaskImagesByDate,
} from './task.repository.js';
import { sendDailySummary } from '../../services/line/messages/daily-summary.js';
import type { Task, CreateTaskDto } from './task.types.js';

const STORAGE_BUCKET = 'task-images';

async function deleteStorageFiles(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(storagePaths);
  if (error) console.error('[tasks] storage delete failed:', error.message);
}

export async function createTasks(dtos: CreateTaskDto[]): Promise<Task[]> {
  const inserted = await insertTasks(
    dtos.map((d) => ({
      task_date: d.task_date,
      task: d.task,
      detail: d.detail,
      employee_ids: d.employee_ids,
    }))
  );

  await insertTaskImages(
    dtos.flatMap((dto, i) =>
      (dto.images ?? []).map((img) => ({ task_id: inserted[i].task_id, ...img }))
    )
  );

  if (dtos.length > 0) {
    sendDailySummary(dtos[0].task_date, dtos).catch((err) => {
      console.error('[tasks] LINE daily summary failed:', err);
    });
  }

  return getTasksByDate(dtos[0].task_date);
}

export async function getTasksForDate(date: string): Promise<Task[]> {
  return getTasksByDate(date);
}

export async function replaceTasksForDate(date: string, dtos: CreateTaskDto[]): Promise<Task[]> {
  const oldImages = await getTaskImagesByDate(date);
  const keptPaths = new Set(dtos.flatMap((d) => (d.images ?? []).map((img) => img.storage_path)));
  const toDelete = oldImages.filter((img) => !keptPaths.has(img.storage_path)).map((img) => img.storage_path);

  await deleteStorageFiles(toDelete);
  await deleteTasksByDate(date);

  if (dtos.length === 0) return [];

  const inserted = await insertTasks(
    dtos.map((d) => ({
      task_date: d.task_date,
      task: d.task,
      detail: d.detail,
      employee_ids: d.employee_ids,
    }))
  );

  await insertTaskImages(
    dtos.flatMap((dto, i) =>
      (dto.images ?? []).map((img) => ({ task_id: inserted[i].task_id, ...img }))
    )
  );

  return getTasksByDate(date);
}

export async function triggerSummary(date: string): Promise<void> {
  await sendDailySummary(date, []);
}
