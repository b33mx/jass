import type { Request, Response, NextFunction } from 'express';
import { generateDailyReport } from './report.service.js';
import { generateWorkReport, generateWorkReportByPeriodId } from './report.work.service.js';
import { generateTimecardReport } from './report.timecard.service.js';
import { generatePayrollPacketReport } from './report.payroll-packet.service.js';
import { env } from '../../config/env.js';
import { buildReportUrl, createReportToken, createShortLink, parseReportToken, resolveShortLink, type ReportKind } from './report-link-token.js';
import { getPublicBaseUrl } from '../../lib/public-url.js';
import { selectActivePeriods } from '../periods/period.repository.js';

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

function getCompanyId(req: Request, tokenCompanyId?: number): number {
  return tokenCompanyId ?? req.lineUser!.companyId;
}

export async function handleDailyReport(req: Request, res: Response, next: NextFunction) {
  let date = req.query.date as string | undefined;
  let tokenCompanyId: number | undefined;
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'daily' || !payload.date) throw new Error('invalid token kind');
      date = payload.date;
      tokenCompanyId = payload.companyId;
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
    const pdf = await generateDailyReport(date, getCompanyId(req, tokenCompanyId));
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
  let tokenCompanyId: number | undefined;
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'work' || !payload.date) throw new Error('invalid token kind');
      date = payload.date;
      tokenCompanyId = payload.companyId;
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
    const buf = await generateWorkReport(date, getCompanyId(req, tokenCompanyId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="work-report-${date}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

export async function handleCurrentWorkReport(req: Request, res: Response, next: NextFunction) {
  const date = todayInTimezone(env.TZ);
  try {
    const buf = await generateWorkReport(date, req.lineUser!.companyId);
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
  let tokenCompanyId: number | undefined;
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'timecard' || !payload.periodId) throw new Error('invalid token kind');
      periodId = payload.periodId;
      tokenCompanyId = payload.companyId;
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
    const buf = await generateTimecardReport(periodId, getCompanyId(req, tokenCompanyId));
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
  let tokenCompanyId: number | undefined;
  const token = req.query.t as string | undefined;
  if (token) {
    try {
      const payload = parseReportToken(token);
      if (payload.kind !== 'payroll-packet' || !payload.periodId) throw new Error('invalid token kind');
      periodId = payload.periodId;
      tokenCompanyId = payload.companyId;
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
    const buf = await generatePayrollPacketReport(periodId, getCompanyId(req, tokenCompanyId));
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
    companyId: req.lineUser!.companyId,
  });
  const baseUrl = getPublicBaseUrl();
  const url = buildReportUrl(baseUrl, token);
  const shortCode = createShortLink(baseUrl, token);
  res.json({ token, url, shortCode });
}

export function handleShortLink(req: Request, res: Response) {
  const code = req.params.code as string;
  const token = resolveShortLink(code);
  if (!token) {
    res.status(404).send('ลิงก์นี้หมดอายุหรือไม่ถูกต้อง');
    return;
  }
  res.redirect(302, `/api/reports/access?t=${encodeURIComponent(token)}`);
}

async function serveSelectPeriodPage(req: Request, res: Response, next: NextFunction, token: string) {
  try {
    const payload = parseReportToken(token);
    const periods = await selectActivePeriods(payload.companyId);
    const apiBase = req.protocol + '://' + req.get('host');
    const encodedToken = encodeURIComponent(token);

    const periodRows = periods.length === 0
      ? `<div class="empty">ไม่มีงวดที่เปิดอยู่<span>กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดงวดใหม่</span></div>`
      : periods.map((p) => {
          const start = new Date(p.start_date + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
          const end = new Date(p.end_date + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
          const href = `${apiBase}/api/reports/work-period?t=${encodedToken}&period_id=${p.period_id}`;
          return `<a class="card" href="${href}" target="_blank" rel="noopener noreferrer">
  <span class="range">${start} – ${end}</span>
  <span class="badge">เปิดอยู่</span>
  <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
</a>`;
        }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>เลือกงวด</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#fff7e8;min-height:100svh;display:flex;justify-content:center;padding:24px 16px}
.wrap{width:100%;max-width:440px}
.header{background:#7F1D1D;border-radius:20px 20px 0 0;padding:20px 20px 36px;position:relative;overflow:hidden}
.header::before{content:'';position:absolute;right:-24px;top:-24px;width:112px;height:112px;border-radius:50%;background:rgba(255,255,255,.1)}
.header h1{color:#fff;font-size:17px;font-weight:700}
.header p{color:rgba(255,255,255,.75);font-size:12px;margin-top:4px}
.body{background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 28px;margin-top:-16px;display:flex;flex-direction:column;gap:10px}
.card{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #e4e4e7;border-radius:16px;background:#fafafa;text-decoration:none;color:#111827;transition:background .15s}
.card:hover{background:#f4f4f5}
.card .range{font-size:14px;font-weight:700;flex:1}
.badge{font-size:10px;font-weight:600;background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:999px;padding:2px 8px;white-space:nowrap}
.card svg{width:16px;height:16px;stroke:#a1a1aa;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.empty{color:#52525b;font-size:14px;font-weight:600;text-align:center;padding:32px 16px;background:#f4f4f5;border-radius:16px;display:flex;flex-direction:column;gap:6px}
.empty span{color:#71717a;font-size:12px;font-weight:400}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>เลือกงวด</h1><p>วันที่ปัจจุบันไม่ตรงกับงวดที่มีอยู่ กรุณาเลือกงวดที่ต้องการ</p></div>
  <div class="body">${periodRows}</div>
</div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
}

export async function handleGetActivePeriods(req: Request, res: Response, next: NextFunction) {
  const token = req.query.t as string | undefined;
  if (!token) {
    res.status(400).json({ error: 't query param is required' });
    return;
  }
  try {
    const payload = parseReportToken(token);
    const periods = await selectActivePeriods(payload.companyId);
    res.json(periods);
  } catch (err) {
    if (err instanceof Error && err.message.includes('token')) {
      res.status(400).json({ error: 'invalid report token' });
      return;
    }
    next(err);
  }
}

export async function handleWorkPeriodReport(req: Request, res: Response, next: NextFunction) {
  const token = req.query.t as string | undefined;
  const periodId = Number(req.query.period_id);
  if (!token) {
    res.status(400).json({ error: 't query param is required' });
    return;
  }
  if (!Number.isInteger(periodId) || periodId <= 0) {
    res.status(400).json({ error: 'period_id query param is required' });
    return;
  }
  try {
    const payload = parseReportToken(token);
    const buf = await generateWorkReportByPeriodId(periodId, payload.companyId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="work-report-period-${periodId}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    if (err instanceof Error && err.message.includes('token')) {
      res.status(400).json({ error: 'invalid report token' });
      return;
    }
    next(err);
  }
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
      try {
        const buf = await generateWorkReport(payload.date, payload.companyId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="work-report-${payload.date}.pdf"`);
        res.setHeader('Content-Length', buf.length);
        res.send(buf);
      } catch (err) {
        if (err instanceof Error && err.message === 'ไม่พบงวดสำหรับวันที่นี้') {
          return serveSelectPeriodPage(req, res, next, token);
        }
        next(err);
      }
      return;
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
