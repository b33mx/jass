import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { addWageHistory, getWageHistory } from './wage-history.service.js';

const addWageSchema = z.object({
  wage: z.number().positive('ค่าแรงต้องมากกว่า 0'),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง'),
  note: z.string().optional(),
});

export async function handleGetWageHistory(req: Request, res: Response, next: NextFunction) {
  const employeeId = parseInt(req.params.id, 10);
  if (isNaN(employeeId)) {
    res.status(400).json({ error: 'id ไม่ถูกต้อง' });
    return;
  }
  try {
    const history = await getWageHistory(employeeId, req.lineUser!.companyId);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

export async function handleAddWageHistory(req: Request, res: Response, next: NextFunction) {
  const employeeId = parseInt(req.params.id, 10);
  if (isNaN(employeeId)) {
    res.status(400).json({ error: 'id ไม่ถูกต้อง' });
    return;
  }
  const parsed = addWageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const record = await addWageHistory(employeeId, parsed.data, req.lineUser!.companyId);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}
