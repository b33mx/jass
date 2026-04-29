export interface TaskImage {
  image_id: number;
  task_id: number;
  file_name: string;
  public_url: string;
  storage_path: string;
  module: number;
  created_at: string;
}

export interface Task {
  task_id: number;
  task_date: string;
  task: string;
  detail: string | null;
  employee_ids: string;
  images: TaskImage[];
  created_at: string;
}
