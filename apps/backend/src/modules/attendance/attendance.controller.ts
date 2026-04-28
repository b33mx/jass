import type { Request, Response } from 'express';
import { z } from 'zod';
import { getAttendanceForDate, getMissingDates, saveAttendanceBatch } from './attendance.service.js';

const batchSchema = z.object({
  period_id: z.number().int().positive(),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(
    z.object({
      employee_id: z.number().int().positive(),
      morning_check: z.boolean().optional(),
      afternoon_check: z.boolean().optional(),
      ot: z.number().min(0).optional(),
    })
  ).min(1),
});

export async function handleGetMissingDates(req: Request, res: Response) {
  const periodId = parseInt(req.query.period_id as string, 10);
  if (isNaN(periodId)) {
    res.status(400).json({ error: 'period_id ไม่ถูกต้อง' });
    return;
  }

  try {
    const dates = await getMissingDates(periodId);
    res.json(dates);
  } catch (err) {
    console.error('[attendance] getMissingDates failed:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงวันที่ยังไม่ได้ลงเวลาได้' });
  }
}

export async function handleGetAttendance(req: Request, res: Response) {
  const periodId = parseInt(req.query.period_id as string, 10);
  const date = req.query.date as string;

  if (isNaN(periodId) || !date) {
    res.status(400).json({ error: 'period_id และ date จำเป็นต้องระบุ' });
    return;
  }

  try {
    const records = await getAttendanceForDate(periodId, date);
    res.json(records);
  } catch (err) {
    console.error('[attendance] getAttendance failed:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการลงเวลาได้' });
  }
}

export async function handleSaveAttendanceBatch(req: Request, res: Response) {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const result = await saveAttendanceBatch(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    console.error('[attendance] saveBatch failed:', err);
    res.status(500).json({ error: 'ไม่สามารถบันทึกการลงเวลาได้' });
  }
}
