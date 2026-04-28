import { insertTasks } from './task.repository.ts';
import { sendDailySummary } from '../../services/line/messages/daily-summary.ts';
import type { Task, CreateTaskDto } from './task.types.ts';

export async function createTasks(dtos: CreateTaskDto[]): Promise<Task[]> {
  const tasks = await insertTasks(
    dtos.map((d) => ({
      task_date: d.task_date,
      task: d.task,
      detail: d.detail,
      employee_ids: d.employee_ids,
    }))
  );

  if (dtos.length > 0) {
    sendDailySummary(dtos[0].task_date, dtos).catch((err) => {
      console.error('[tasks] LINE daily summary failed:', err);
    });
  }

  return tasks;
}
