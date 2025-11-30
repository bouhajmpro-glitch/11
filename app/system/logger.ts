import { supabase } from '../lib/supabaseClient';

export async function logSystemError(source: string, error: any) {
  console.error(`[${source}] Failed:`, error);
  
  // إرسال التقرير للسحابة (بشكل خفي)
  try {
    await supabase.from('system_logs').insert([{
      source: source,
      error_message: String(error),
      timestamp: new Date().toISOString()
    }]);
  } catch (e) {
    // حتى لو فشل التبليغ، لا نوقف التطبيق
  }
}
