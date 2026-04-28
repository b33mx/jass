export interface Task {
  task_id: number;
  task_date: string;
  task: string;
  detail: string | null;
  employee_ids: string;
  created_at: string;
}
