import type { Request, Response } from 'express';
import { generateDailyReport } from './report.service.js';
import { generateWorkReport } from './report.work.service.js';
import { env } from '../../config/env.js';

function todayInTimezone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export async function handleDailyReport(req: Request, res: Response) {
  const date = req.query.date as string | undefined;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });
    return;
  }
  try {
    const pdf = await generateDailyReport(date);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="daily-report-${date}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  } catch (err) {
    console.error('[reports] generateDailyReport failed:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้างรายงานได้' });
  }
}

export async function handleWorkReport(req: Request, res: Response) {
  const date = req.query.date as string | undefined;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });
    return;
  }
  try {
    const buf = await generateWorkReport(date);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="work-report-${date}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    console.error('[reports] generateWorkReport failed:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้างรายงานได้' });
  }
}

export async function handleCurrentWorkReport(_req: Request, res: Response) {
  const date = todayInTimezone(env.TZ);
  try {
    const buf = await generateWorkReport(date);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="work-report-${date}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    console.error('[reports] handleCurrentWorkReport failed:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้างรายงานได้' });
  }
}
