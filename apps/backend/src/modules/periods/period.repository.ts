import { supabase } from '../../lib/supabase.js';
import type { Period } from './period.types.js';

const PERIOD_FIELDS = 'period_id, start_date, end_date, is_active, created_at, deleted_at';

export async function selectActivePeriod(today: string, companyId?: number): Promise<Period | null> {
  let query = supabase
    .from('periods')
    .select(PERIOD_FIELDS)
    .eq('is_active', true)
    .is('deleted_at', null)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: false })
    .limit(1);

  if (companyId !== undefined) query = query.eq('company_id', companyId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Period | null) ?? null;
}

export async function selectActivePeriods(companyId: number): Promise<Period[]> {
  const { data, error } = await supabase
    .from('periods')
    .select(PERIOD_FIELDS)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Period[];
}

export async function selectPeriodByDate(date: string, companyId: number): Promise<Period | null> {
  const { data, error } = await supabase
    .from('periods')
    .select(PERIOD_FIELDS)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .lte('start_date', date)
    .gte('end_date', date)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Period | null) ?? null;
}

export async function selectOverlappingPeriod(
  start: string,
  end: string,
  companyId: number,
  excludeId?: number,
): Promise<Period | null> {
  let query = supabase
    .from('periods')
    .select(PERIOD_FIELDS)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .lte('start_date', end)
    .gte('end_date', start)
    .limit(1);

  if (excludeId !== undefined) query = query.neq('period_id', excludeId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Period | null) ?? null;
}

export async function insertPeriod(data: { start_date: string; end_date: string; company_id: number }): Promise<Period> {
  const { data: period, error } = await supabase
    .from('periods')
    .insert({ ...data, is_active: true })
    .select(PERIOD_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  return period as Period;
}

export async function selectAllPeriods(companyId: number): Promise<Period[]> {
  const { data, error } = await supabase
    .from('periods')
    .select(PERIOD_FIELDS)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Period[];
}

export async function selectPeriodById(id: number, companyId?: number): Promise<Period | null> {
  let query = supabase
    .from('periods')
    .select(PERIOD_FIELDS)
    .eq('period_id', id)
    .is('deleted_at', null);

  if (companyId !== undefined) query = query.eq('company_id', companyId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Period | null) ?? null;
}

export async function closePeriodById(id: number, companyId: number): Promise<Period> {
  const { data, error } = await supabase
    .from('periods')
    .update({ is_active: false })
    .eq('period_id', id)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .select(PERIOD_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  return data as Period;
}

export async function updatePeriodDates(
  id: number,
  companyId: number,
  start_date: string,
  end_date: string,
): Promise<Period> {
  const { data, error } = await supabase
    .from('periods')
    .update({ start_date, end_date })
    .eq('period_id', id)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .select(PERIOD_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  return data as Period;
}

export async function softDeletePeriodById(id: number, companyId: number): Promise<Period> {
  const { data, error } = await supabase
    .from('periods')
    .update({ deleted_at: new Date().toISOString() })
    .eq('period_id', id)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .select(PERIOD_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  return data as Period;
}
