import type { Request, Response, NextFunction } from 'express';
import { generateDailyReport } from './report.service.js';
import { generateWorkReport } from './report.work.service.js';
import { generateTimecardReport } from './report.timecard.service.js';
import { generatePayrollPacketReport } from './report.payroll-packet.service.js';
import { env } from '../../config/env.js';
import { buildReportUrl, createReportToken, parseReportToken, type ReportKind } from './report-link-token.js';

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

export async function handleDailyReport(req: Request, res: Response, next: NextFunction) {
  let date = req.query.date as string | undefined;
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'daily' || !payload.date) throw new Error('invalid token kind');
      date = payload.date;
    } catch {
      res.status(400).json({ error: 'invalid report token' });
      return;
    }
  }
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
    next(err);
  }
}

export async function handleWorkReport(req: Request, res: Response, next: NextFunction) {
  let date = req.query.date as string | undefined;
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'work' || !payload.date) throw new Error('invalid token kind');
      date = payload.date;
    } catch {
      res.status(400).json({ error: 'invalid report token' });
      return;
    }
  }
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
    next(err);
  }
}

export async function handleCurrentWorkReport(_req: Request, res: Response, next: NextFunction) {
  const date = todayInTimezone(env.TZ);
  try {
    const buf = await generateWorkReport(date);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="work-report-${date}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

export async function handleTimecardReport(req: Request, res: Response, next: NextFunction) {
  let periodId = Number(req.query.period_id);
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'timecard' || !payload.periodId) throw new Error('invalid token kind');
      periodId = payload.periodId;
    } catch {
      res.status(400).json({ error: 'invalid report token' });
      return;
    }
  }
  if (!Number.isInteger(periodId) || periodId <= 0) {
    res.status(400).json({ error: 'period_id query param is required and must be a positive integer' });
    return;
  }
  try {
    const buf = await generateTimecardReport(periodId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="timecard-period-${periodId}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

export async function handlePayrollPacketReport(req: Request, res: Response, next: NextFunction) {
  let periodId = Number(req.query.period_id);
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'payroll-packet' || !payload.periodId) throw new Error('invalid token kind');
      periodId = payload.periodId;
    } catch {
      res.status(400).json({ error: 'invalid report token' });
      return;
    }
  }
  if (!Number.isInteger(periodId) || periodId <= 0) {
    res.status(400).json({ error: 'period_id query param is required and must be a positive integer' });
    return;
  }
  try {
    const buf = await generatePayrollPacketReport(periodId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="payroll-packet-period-${periodId}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

export async function handleCreateReportLink(req: Request, res: Response) {
  const kind = req.body?.kind as ReportKind | undefined;
  const date = req.body?.date as string | undefined;
  const periodId = Number(req.body?.period_id);

  if (!kind || !['daily', 'work', 'timecard', 'payroll-packet'].includes(kind)) {
    res.status(400).json({ error: 'kind is required' });
    return;
  }

  if ((kind === 'daily' || kind === 'work') && (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    return;
  }

  if ((kind === 'timecard' || kind === 'payroll-packet') && (!Number.isInteger(periodId) || periodId <= 0)) {
    res.status(400).json({ error: 'period_id is required and must be a positive integer' });
    return;
  }

  const token = createReportToken({
    kind,
    date: kind === 'daily' || kind === 'work' ? date : undefined,
    periodId: kind === 'timecard' || kind === 'payroll-packet' ? periodId : undefined,
  });
  const url = buildReportUrl(env.API_BASE_URL, token);
  res.json({ token, url });
}

export async function handleReportAccess(req: Request, res: Response, next: NextFunction) {
  const token = req.query.t as string | undefined;
  if (!token) {
    res.status(400).json({ error: 't query param is required' });
    return;
  }
  try {
    const payload = parseReportToken(token);
    if (payload.kind === 'daily' && payload.date) {
      req.query.date = payload.date;
      return handleDailyReport(req, res, next);
    }
    if (payload.kind === 'work' && payload.date) {
      req.query.date = payload.date;
      return handleWorkReport(req, res, next);
    }
    if (payload.kind === 'timecard' && payload.periodId) {
      req.query.period_id = String(payload.periodId);
      return handleTimecardReport(req, res, next);
    }
    if (payload.kind === 'payroll-packet' && payload.periodId) {
      req.query.period_id = String(payload.periodId);
      return handlePayrollPacketReport(req, res, next);
    }
    res.status(400).json({ error: 'invalid report token' });
  } catch (err) {
    if (err instanceof Error && err.message.includes('token')) {
      res.status(400).json({ error: 'invalid report token' });
      return;
    }
    next(err);
  }
}
