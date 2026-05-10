import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { calculatePayroll, closePeriod, createPeriod, getActivePeriod, getAllPeriods } from './period.service.js';

const createPeriodSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD'),
}).refine((v) => v.end_date >= v.start_date, { message: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น' });

export async function handleGetAllPeriods(req: Request, res: Response, next: NextFunction) {
  try {
    const periods = await getAllPeriods(req.lineUser!.companyId);
    res.json(periods);
  } catch (err) {
    next(err);
  }
}

export async function handleGetActivePeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const period = await getActivePeriod(req.lineUser!.companyId);
    res.json({ period });
  } catch (err) {
    next(err);
  }
}

export async function handleCalculatePayroll(req: Request, res: Response, next: NextFunction) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'period id ไม่ถูกต้อง' });
    return;
  }
  try {
    const result = await calculatePayroll(id, req.lineUser!.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleCreatePeriod(req: Request, res: Response, next: NextFunction) {
  const parsed = createPeriodSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const period = await createPeriod(parsed.data, req.lineUser!.companyId);
    res.status(201).json(period);
  } catch (err) {
    next(err);
  }
}

export async function handleClosePeriod(req: Request, res: Response, next: NextFunction) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'period id ไม่ถูกต้อง' });
    return;
  }
  try {
    const period = await closePeriod(id, req.lineUser!.companyId);
    res.json(period);
  } catch (err) {
    next(err);
  }
}
