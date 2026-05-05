import { closePeriodById, insertPeriod, selectActivePeriod, selectAllPeriods, selectOverlappingPeriod, selectPeriodById } from './period.repository.js';
import { selectAttendanceByPeriodId } from '../attendance/attendance.repository.js';
import { selectAllEmployees } from '../employees/employee.repository.js';
import type { CreatePeriodDto, PayrollResult, Period } from './period.types.js';

export async function getActivePeriod(): Promise<Period | null> {
  const today = new Date().toISOString().slice(0, 10);
  return selectActivePeriod(today);
}

export async function createPeriod(dto: CreatePeriodDto): Promise<Period> {
  const overlap = await selectOverlappingPeriod(dto.start_date, dto.end_date);
  if (overlap) {
    const err = Object.assign(
      new Error(`วันที่ทับซ้อนกับงวด ${overlap.start_date} – ${overlap.end_date}`),
      { status: 409 },
    );
    throw err;
  }
  return insertPeriod({ start_date: dto.start_date, end_date: dto.end_date });
}

export async function getPeriodById(id: number): Promise<Period | null> {
  return selectPeriodById(id);
}

export async function getAllPeriods(): Promise<Period[]> {
  return selectAllPeriods();
}

export async function closePeriod(periodId: number): Promise<Period> {
  const period = await getPeriodById(periodId);
  if (!period) throw Object.assign(new Error('ไม่พบงวด'), { status: 404 });
  if (!period.is_active) return period;
  return closePeriodById(periodId);
}

export async function calculatePayroll(periodId: number): Promise<PayrollResult> {
  const period = await getPeriodById(periodId);
  if (!period) throw Object.assign(new Error('ไม่พบงวด'), { status: 404 });

  const [allAtt, employees] = await Promise.all([
    selectAttendanceByPeriodId(periodId),
    selectAllEmployees(),
  ]);

  const attByEmployee = new Map<number, typeof allAtt>();
  for (const a of allAtt) {
    if (!attByEmployee.has(a.employee_id)) attByEmployee.set(a.employee_id, []);
    attByEmployee.get(a.employee_id)!.push(a);
  }

  let total = 0;
  const breakdown = employees.map((emp) => {
    const records = attByEmployee.get(emp.employee_id) ?? [];
    let days_worked = 0;
    let ot_hours = 0;
    for (const r of records) {
      days_worked += (r.morning_check ? 0.5 : 0) + (r.afternoon_check ? 0.5 : 0);
      ot_hours += r.ot ?? 0;
    }
    const gross = Math.round((days_worked * emp.wage + ot_hours * emp.ot_rate) * 100) / 100;
    total += gross;
    return {
      employee_id: emp.employee_id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      wage: emp.wage,
      ot_rate: emp.ot_rate,
      days_worked,
      ot_hours,
      gross,
    };
  });

  return {
    period_id: period.period_id,
    start_date: period.start_date,
    end_date: period.end_date,
    total: Math.round(total * 100) / 100,
    breakdown,
  };
}
