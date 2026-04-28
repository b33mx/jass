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

export async function getAllPeriods(): Promise<Period[]> {
  const res = await fetch('/api/periods');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลงวดได้');
  }
  return res.json() as Promise<Period[]>;
}

export async function getActivePeriod(): Promise<Period | null> {
  const res = await fetch('/api/periods/active');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลงวดได้');
  }
  const data = await res.json() as { period: Period | null };
  return data.period;
}

export async function createPeriod(payload: CreatePeriodPayload): Promise<Period> {
  const res = await fetch('/api/periods', {
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
