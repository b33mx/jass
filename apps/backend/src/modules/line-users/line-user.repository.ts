import { supabase } from '../../lib/supabase.js';

export async function upsertLineUser(lineUserId: string): Promise<void> {
  await supabase
    .from('line_users')
    .upsert({ line_user_id: lineUserId }, { onConflict: 'line_user_id', ignoreDuplicates: true });
}
