import { apiFetch } from '../lib/api.ts';

export interface Period {
  period_id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface CreatePeriodPayload {
  start_date: string;
  end_date: string;
}

export interface PayrollBreakdown {
  employee_id: number;
  first_name: string;
  last_name: string;
  wage: number;
  ot_rate: number;
  days_worked: number;
  ot_hours: number;
  gross: number;
}

export interface PayrollResult {
  period_id: number;
  start_date: string;
  end_date: string;
  total: number;
  breakdown: PayrollBreakdown[];
}

export async function getAllPeriods(): Promise<Period[]> {
  const res = await apiFetch('/api/periods');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลงวดได้');
  }
  return res.json() as Promise<Period[]>;
}

export async function getActivePeriod(): Promise<Period | null> {
  const res = await apiFetch('/api/periods/active');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลงวดได้');
  }
  const data = await res.json() as { period: Period | null };
  return data.period;
}

export async function createPeriod(payload: CreatePeriodPayload): Promise<Period> {
  const res = await apiFetch('/api/periods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถสร้างงวดได้');
  }
  return res.json() as Promise<Period>;
}

export async function calculatePayroll(periodId: number): Promise<PayrollResult> {
  const res = await apiFetch(`/api/periods/${periodId}/calculate`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถคำนวณเงินเดือนได้');
  }
  return res.json() as Promise<PayrollResult>;
}

export async function closePeriod(periodId: number): Promise<Period> {
  const res = await apiFetch(`/api/periods/${periodId}/close`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถปิดงวดได้');
  }
  return res.json() as Promise<Period>;
}
