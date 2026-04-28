import { supabase } from '../../lib/supabase.js';
import type { Attendance } from './attendance.types.js';

const ATTENDANCE_FIELDS = 'attendance_id, attendance_date, employee_id, period_id, morning_check, afternoon_check, ot, created_at';

export async function selectAttendanceByPeriodAndDate(periodId: number, date: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_FIELDS)
    .eq('period_id', periodId)
    .eq('attendance_date', date);

  if (error) throw new Error(error.message);
  return (data ?? []) as Attendance[];
}

export async function selectLoggedDatesByPeriod(periodId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('attendance_date')
    .eq('period_id', periodId);

  if (error) throw new Error(error.message);
  const dates = new Set((data ?? []).map((r: { attendance_date: string }) => r.attendance_date));
  return Array.from(dates);
}

export async function upsertAttendanceBatch(
  records: Array<{
    attendance_date: string;
    employee_id: number;
    period_id: number;
    morning_check: boolean;
    afternoon_check: boolean;
    ot: number;
  }>
): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(records, { onConflict: 'attendance_date,employee_id,period_id' })
    .select(ATTENDANCE_FIELDS);

  if (error) throw new Error(error.message);
  return (data ?? []) as Attendance[];
}
