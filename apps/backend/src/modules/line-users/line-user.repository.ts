import { supabase } from '../../lib/supabase.js';
import { env } from '../../config/env.js';

export async function upsertLineUser(lineUserId: string, companyId = env.DEFAULT_COMPANY_ID): Promise<void> {
  await supabase
    .from('line_users')
    .upsert({ line_user_id: lineUserId, company_id: companyId }, { onConflict: 'line_user_id' });
}
