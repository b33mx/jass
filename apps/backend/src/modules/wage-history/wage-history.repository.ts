import { supabase } from '../../lib/supabase.js';
import type { WageHistory } from './wage-history.types.js';

export async function insertWageHistory(data: {
  employee_id: number;
  company_id: number;
  wage: number;
  ot_rate: number;
  effective_from: string;
  note?: string | null;
}): Promise<WageHistory> {
  const { data: row, error } = await supabase
    .from('employee_wage_history')
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row as WageHistory;
}

export async function selectWageHistoryByEmployee(
  employeeId: number,
  companyId: number,
): Promise<WageHistory[]> {
  const { data, error } = await supabase
    .from('employee_wage_history')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('company_id', companyId)
    .order('effective_from', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WageHistory[];
}

// ใช้ใน payroll calculation — ดึง history ทุก employee ใน period เดียวกัน
export async function selectWageHistoryForEmployees(
  employeeIds: number[],
  companyId: number,
): Promise<WageHistory[]> {
  if (employeeIds.length === 0) return [];
  const { data, error } = await supabase
    .from('employee_wage_history')
    .select('*')
    .in('employee_id', employeeIds)
    .eq('company_id', companyId)
    .order('employee_id')
    .order('effective_from', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WageHistory[];
}
