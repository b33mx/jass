export interface TaskImageData {
  file_name: string;
  public_url: string;
  storage_path: string;
}

export interface ExistingTaskImage extends TaskImageData {
  image_id: number;
  task_id: number;
}

export interface CreateTaskPayload {
  task_date: string;
  task: string;
  detail?: string;
  employee_ids: string;
  images?: TaskImageData[];
}

export interface Task {
  task_id: number;
  task_date: string;
  task: string;
  detail: string | null;
  employee_ids: string;
  images: ExistingTaskImage[];
  created_at: string;
}

export async function getTasksForDate(date: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลงานได้');
  }
  return res.json();
}

export async function triggerDailySummary(date: string): Promise<void> {
  const res = await fetch('/api/tasks/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถส่งสรุปการทำงานได้');
  }
}

export async function replaceTasksForDate(date: string, tasks: CreateTaskPayload[]): Promise<void> {
  const res = await fetch('/api/tasks', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, tasks }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถบันทึกงานได้');
  }
}

export async function uploadTaskImages(files: File[], periodStart: string): Promise<TaskImageData[]> {
  const { compressImage } = await import('../utils/compressImage.js');
  const compressed = await Promise.all(files.map(compressImage));
  const form = new FormData();
  form.append('period', periodStart);
  compressed.forEach((f) => form.append('images', f));
  const res = await fetch('/api/tasks/images', { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถอัปโหลดรูปภาพได้');
  }
  const data: { files: TaskImageData[] } = await res.json();
  return data.files;
}

export async function createTasks(tasks: CreateTaskPayload[]): Promise<void> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถบันทึกงานได้');
  }
}
