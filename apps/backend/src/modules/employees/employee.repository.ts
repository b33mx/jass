import { supabase } from '../../lib/supabase.ts';
import type { Employee } from './employee.types.ts';

const EMPLOYEE_FIELDS = 'id, first_name, last_name, wage, ot_rate, is_active, created_at, updated_at';

export async function insertEmployee(data: {
  first_name: string;
  last_name: string;
  wage: number;
  ot_rate: number;
}): Promise<Employee> {
  const { data: employee, error } = await supabase
    .from('employees')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return employee as Employee;
}

export async function selectAllEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_FIELDS)
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export async function selectEmployeeById(id: number): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_FIELDS)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Employee;
}

export async function updateEmployeeById(
  id: number,
  data: { first_name: string; last_name: string; wage: number; ot_rate: number }
): Promise<Employee> {
  const { data: employee, error } = await supabase
    .from('employees')
    .update(data)
    .eq('id', id)
    .select(EMPLOYEE_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  return employee as Employee;
}
