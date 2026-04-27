export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  wage: number;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  wage: number;
  ot_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/employees');

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลพนักงานได้');
  }

  return res.json() as Promise<Employee[]>;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const res = await fetch('/api/employees', {
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
  const res = await fetch(`/api/employees/${id}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'ไม่สามารถดึงข้อมูลพนักงานได้');
  }

  return res.json() as Promise<Employee>;
}

export async function updateEmployee(id: number, payload: CreateEmployeePayload): Promise<Employee> {
  const res = await fetch(`/api/employees/${id}`, {
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
