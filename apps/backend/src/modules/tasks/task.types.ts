export type { Task, TaskImage } from '../../models/task.model.js';

export interface TaskImageDto {
  file_name: string;
  public_url: string;
  storage_path: string;
}

export interface CreateTaskDto {
  task_date: string;
  task: string;
  detail?: string;
  employee_ids: string;
  images?: TaskImageDto[];
}

export interface UpdateTaskDto {
  task_date?: string;
  task?: string;
  detail?: string;
  employee_ids?: string;
}
