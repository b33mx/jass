import { selectAttendanceByPeriodAndDate, selectLoggedDatesByPeriod, upsertAttendanceBatch } from './attendance.repository.ts';
import { getPeriodById } from '../periods/period.service.ts';
import type { Attendance, BatchAttendanceDto } from './attendance.types.ts';

function eachDayInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function getMissingDates(periodId: number): Promise<string[]> {
  const period = await getPeriodById(periodId);
  if (!period) throw new Error('ไม่พบงวด');

  const allDates = eachDayInRange(period.start_date, period.end_date);
  const logged = new Set(await selectLoggedDatesByPeriod(periodId));
  return allDates.filter((d) => !logged.has(d));
}

export async function getAttendanceForDate(periodId: number, date: string): Promise<Attendance[]> {
  return selectAttendanceByPeriodAndDate(periodId, date);
}

export async function saveAttendanceBatch(dto: BatchAttendanceDto): Promise<Attendance[]> {
  const records = dto.records.map((r) => ({
    attendance_date: dto.attendance_date,
    employee_id: r.employee_id,
    period_id: dto.period_id,
    morning_check: r.morning_check ?? false,
    afternoon_check: r.afternoon_check ?? false,
    ot: r.ot ?? 0,
  }));
  return upsertAttendanceBatch(records);
}
