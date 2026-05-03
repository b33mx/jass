import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { supabase } from '../../lib/supabase.js';
import { createTasks, getTasksForDate, replaceTasksForDate, triggerSummary } from './task.service.js';

const STORAGE_BUCKET = 'task-images';
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const imageSchema = z.object({
  file_name: z.string().min(1),
  public_url: z.string().url(),
  storage_path: z.string().min(1),
});

const taskItemSchema = z.object({
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  task: z.string().min(1),
  detail: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  employee_ids: z.string(),
  images: z.array(imageSchema).max(MAX_IMAGES).optional(),
});

const batchSchema = z.object({ tasks: z.array(taskItemSchema).min(1) });

export async function handleTriggerSummary(req: Request, res: Response, next: NextFunction) {
  const { date } = req.body as { date?: string };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    return;
  }
  try {
    await triggerSummary(date);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function handleGetTasksForDate(req: Request, res: Response, next: NextFunction) {
  const date = req.query.date as string | undefined;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });
    return;
  }
  try {
    const tasks = await getTasksForDate(date);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function handleReplaceTasksForDate(req: Request, res: Response, next: NextFunction) {
  const parsed = z.object({
    tasks: z.array(taskItemSchema),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const result = await replaceTasksForDate(parsed.data.date, parsed.data.tasks);
    if (parsed.data.tasks.length > 0) {
      const { sendDailySummary } = await import('../../services/line/messages/daily-summary.js');
      sendDailySummary(parsed.data.date, parsed.data.tasks).catch((err) => {
        console.error('[tasks] LINE daily summary failed:', err);
      });
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleUploadImages(req: Request, res: Response, next: NextFunction) {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    return;
  }
  if (files.length > MAX_IMAGES) {
    res.status(400).json({ error: `อัปโหลดได้สูงสุด ${MAX_IMAGES} รูป` });
    return;
  }

  const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
  if (oversized) {
    res.status(400).json({ error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' });
    return;
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const invalid = files.find((f) => !allowed.includes(f.mimetype));
  if (invalid) {
    res.status(400).json({ error: 'รองรับเฉพาะไฟล์ภาพ (JPEG, PNG, WebP, GIF)' });
    return;
  }

  try {
    const period = /^\d{4}-\d{2}-\d{2}$/.test(req.body?.period)
      ? req.body.period as string
      : new Date().toISOString().slice(0, 10);
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const storagePath = `task/${period}/${randomUUID()}${ext}`;
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
        return {
          file_name: file.originalname,
          public_url: data.publicUrl,
          storage_path: storagePath,
        };
      })
    );
    res.status(201).json({ files: uploadedFiles });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateTasks(req: Request, res: Response, next: NextFunction) {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const result = await createTasks(parsed.data.tasks);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
