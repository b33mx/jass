import {
  insertWageHistory,
  selectWageHistoryByEmployee,
} from './wage-history.repository.js';
import { updateEmployeeWage } from '../employees/employee.repository.js';
import type { WageHistory, AddWageHistoryDto } from './wage-history.types.js';

function calcOtRate(wage: number): number {
  return parseFloat(((wage / 8) * 1.5).toFixed(2));
}

export async function addWageHistory(
  employeeId: number,
  dto: AddWageHistoryDto,
  companyId: number,
): Promise<WageHistory> {
  const ot_rate = calcOtRate(dto.wage);
  const record = await insertWageHistory({
    employee_id: employeeId,
    company_id: companyId,
    wage: dto.wage,
    ot_rate,
    effective_from: dto.effectiveFrom,
    note: dto.note ?? null,
  });

  // sync employees.wage ถ้า record ใหม่คือล่าสุด
  const history = await selectWageHistoryByEmployee(employeeId, companyId);
  const latest = history[0]; // DESC order
  if (latest && latest.id === record.id) {
    await updateEmployeeWage(employeeId, companyId, latest.wage, latest.ot_rate);
  }

  return record;
}

export async function getWageHistory(
  employeeId: number,
  companyId: number,
): Promise<WageHistory[]> {
  return selectWageHistoryByEmployee(employeeId, companyId);
}
