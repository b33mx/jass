import { apiFetch } from '../lib/api';

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  wage: number;
}

export interface UpdateEmployeePayload {
  firstName: string;
  lastName: string;
}

export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  wage: number;
  ot_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WageHistory {
  id: number;
  employee_id: number;
  company_id: number;
  wage: number;
  ot_rate: number;
  effective_from: string;
  note: string | null;
  created_at: string;
}

export interface AddWageHistoryPayload {
  wage: number;
  effectiveFrom: string;
  note?: string;
}

export async function getAllEmployees(): Promise<Employee[]> {
  const res = await apiFetch('/api/employees');

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลพนักงานได้');
  }

  return res.json() as Promise<Employee[]>;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const res = await apiFetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถบันทึกข้อมูลพนักงานได้');
  }

  return res.json() as Promise<Employee>;
}

export async function getEmployeeById(id: number): Promise<Employee> {
  const res = await apiFetch(`/api/employees/${id}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลพนักงานได้');
  }

  return res.json() as Promise<Employee>;
}

export async function updateEmployee(id: number, payload: UpdateEmployeePayload): Promise<Employee> {
  const res = await apiFetch(`/api/employees/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถแก้ไขข้อมูลพนักงานได้');
  }

  return res.json() as Promise<Employee>;
}

export async function getWageHistory(employeeId: number): Promise<WageHistory[]> {
  const res = await apiFetch(`/api/employees/${employeeId}/wage-history`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงประวัติค่าแรงได้');
  }
  return res.json() as Promise<WageHistory[]>;
}

export async function addWageHistory(
  employeeId: number,
  payload: AddWageHistoryPayload,
): Promise<WageHistory> {
  const res = await apiFetch(`/api/employees/${employeeId}/wage-history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถบันทึกค่าแรงใหม่ได้');
  }
  return res.json() as Promise<WageHistory>;
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await apiFetch(`/api/employees/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถลบข้อมูลพนักงานได้');
  }
}
