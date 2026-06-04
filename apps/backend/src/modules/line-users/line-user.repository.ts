import { supabase } from '../../lib/supabase.js';

export async function upsertLineUser(lineUserId: string): Promise<void> {
  await supabase
    .from('line_users')
    .upsert({ line_user_id: lineUserId }, { onConflict: 'line_user_id', ignoreDuplicates: true });
}

export async function getLineUserByLineId(
  lineUserId: string
): Promise<{ company_id: number | null; role: string } | null> {
  const { data, error } = await supabase
    .from('line_users')
    .select('company_id, role')
    .eq('line_user_id', lineUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as { company_id: number | null; role: string } | null;
}

export async function getLineUserIdsByCompany(companyId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from('line_users')
    .select('line_user_id')
    .eq('company_id', companyId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.line_user_id as string);
}
