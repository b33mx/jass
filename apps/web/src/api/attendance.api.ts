export interface Attendance {
  attendance_id: number;
  attendance_date: string;
  employee_id: number;
  period_id: number;
  morning_check: boolean;
  afternoon_check: boolean;
  ot: number;
  created_at: string;
}

export interface AttendanceBatchRecord {
  employee_id: number;
  morning_check: boolean;
  afternoon_check: boolean;
  ot: number;
}

export interface AttendanceBatchPayload {
  period_id: number;
  attendance_date: string;
  records: AttendanceBatchRecord[];
}

export async function getMissingDates(periodId: number): Promise<string[]> {
  const res = await fetch(`/api/attendance/missing-dates?period_id=${periodId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงวันที่ได้');
  }
  return res.json() as Promise<string[]>;
}

export async function getAttendanceForDate(periodId: number, date: string): Promise<Attendance[]> {
  const res = await fetch(`/api/attendance?period_id=${periodId}&date=${date}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลการลงเวลาได้');
  }
  return res.json() as Promise<Attendance[]>;
}

export async function saveAttendanceBatch(payload: AttendanceBatchPayload): Promise<Attendance[]> {
  const res = await fetch('/api/attendance/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log(payload)
  if (!res.ok) {
    console.log(res)
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถบันทึกการลงเวลาได้');
  }
  return res.json() as Promise<Attendance[]>;
}
