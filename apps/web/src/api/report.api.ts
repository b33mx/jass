import { apiFetch } from '../lib/api';

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
  const data = await res.json() as { token: string; url?: string; shortCode?: string };
  if (data.shortCode) return `${window.location.origin}/r/${data.shortCode}`;
  return `${window.location.origin}/api/reports/access?t=${encodeURIComponent(data.token)}`;
}
