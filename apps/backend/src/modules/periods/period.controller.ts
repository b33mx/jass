import type { Request, Response } from 'express';
import { z } from 'zod';
import { createPeriod, getActivePeriod, getAllPeriods } from './period.service.js';

const createPeriodSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
}).refine((v) => v.end_date >= v.start_date, { message: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น' });

export async function handleGetAllPeriods(_req: Request, res: Response) {
  try {
    const periods = await getAllPeriods();
    res.json(periods);
  } catch (err) {
    console.error('[period] getAll failed:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลงวดได้' });
  }
}

export async function handleGetActivePeriod(_req: Request, res: Response) {
  try {
    const period = await getActivePeriod();
    res.json({ period });
  } catch (err) {
    console.error('[period] getActive failed:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลงวดได้' });
  }
}

export async function handleCreatePeriod(req: Request, res: Response) {
  const parsed = createPeriodSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const period = await createPeriod(parsed.data);
    res.status(201).json(period);
  } catch (err) {
    console.error('[period] create failed:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้างงวดได้' });
  }
}
