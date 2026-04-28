import type { Request, Response } from 'express';
import { z } from 'zod';
import { createTasks } from './task.service.ts';

const batchSchema = z.object({
  tasks: z
    .array(
      z.object({
        task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        task: z.string().min(1),
        detail: z.string().optional(),
        employee_ids: z.string(),
      })
    )
    .min(1),
});

export async function handleCreateTasks(req: Request, res: Response) {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const result = await createTasks(parsed.data.tasks);
    res.status(201).json(result);
  } catch (err) {
    console.error('[tasks] createTasks failed:', err);
    res.status(500).json({ error: 'ไม่สามารถบันทึกงานได้' });
  }
}
