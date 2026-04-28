export interface CreateTaskPayload {
  task_date: string;
  task: string;
  detail?: string;
  employee_ids: string;
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
