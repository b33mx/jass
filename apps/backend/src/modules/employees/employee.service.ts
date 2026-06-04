import {
  insertEmployee,
  selectAllEmployees,
  selectEmployeeById,
  softDeleteEmployeeById,
  updateEmployeeById,
} from './employee.repository.js';
import { insertWageHistory } from '../wage-history/wage-history.repository.js';
import type { CreateEmployeeDto, Employee } from './employee.types.js';

function calcOtRate(wage: number): number {
  return parseFloat(((wage / 8) * 1.5).toFixed(2));
}

export async function createEmployee(dto: CreateEmployeeDto, companyId: number): Promise<Employee> {
  const ot_rate = calcOtRate(dto.wage);
  const employee = await insertEmployee({
    first_name: dto.firstName,
    last_name: dto.lastName,
    wage: dto.wage,
    ot_rate,
    company_id: companyId,
  });
  // สร้าง history record แรกพร้อมกัน
  const today = new Date();
  const effectiveFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  await insertWageHistory({
    employee_id: employee.employee_id,
    company_id: companyId,
    wage: dto.wage,
    ot_rate,
    effective_from: effectiveFrom,
    note: 'ค่าแรงเริ่มต้น',
  });
  return employee;
}

export async function getAllEmployees(companyId: number): Promise<Employee[]> {
  return selectAllEmployees(companyId);
}

export async function getEmployeeById(id: number, companyId: number): Promise<Employee | null> {
  return selectEmployeeById(id, companyId);
}

export async function updateEmployee(
  id: number,
  dto: { firstName: string; lastName: string },
  companyId: number,
): Promise<Employee> {
  return updateEmployeeById(id, companyId, {
    first_name: dto.firstName,
    last_name: dto.lastName,
  });
}

export async function deleteEmployee(id: number, companyId: number): Promise<Employee | null> {
  return softDeleteEmployeeById(id, companyId);
}
