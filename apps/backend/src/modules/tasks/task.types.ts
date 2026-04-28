export type { Task } from '../../models/task.model.ts';

export interface CreateTaskDto {
  task_date: string;
  task: string;
  detail?: string;
  employee_ids: string;
}

export interface UpdateTaskDto {
  task_date?: string;
  task?: string;
  detail?: string;
  employee_ids?: string;
}
