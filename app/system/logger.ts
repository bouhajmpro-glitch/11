// app/core/system/logger.ts
import { supabase } from '../lib/supabaseClient'; 

export async function logSystemError(source: string, error: any) {
  console.error(`[SYSTEM FAULT] ${source}:`, error);
  try {
    await supabase.from('system_logs').insert([{ 
      source, 
      error: String(error),
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    // Fail silently
  }
}
