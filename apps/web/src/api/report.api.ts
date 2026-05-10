import { apiFetch } from '../lib/api.ts';

export type ReportKind = 'daily' | 'work' | 'timecard' | 'payroll-packet';

interface CreateReportLinkPayload {
  kind: ReportKind;
  date?: string;
  period_id?: number;
}

export async function createReportLink(payload: CreateReportLinkPayload): Promise<string> {
  const res = await apiFetch('/api/reports/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถสร้างลิงก์รายงานได้');
  }
  const data = await res.json() as { url: string };
  return data.url;
}
