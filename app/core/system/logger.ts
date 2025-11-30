// app/core/system/logger.ts
import { supabase } from '../../lib/supabaseClient'; // تأكد من مسار supabase الصحيح

export async function logSystemError(source: string, error: any) {
  console.error(`[SYSTEM FAULT] ${source}:`, error);
  
  // محاولة إرسال الخطأ للسحابة (اختياري)
  try {
    // نفترض وجود جدول logs، إذا لم يوجد سيفشل بصمت وهذا جيد للسجل
    await supabase.from('system_logs').insert([{ 
      source, 
      error: String(error),
      created_at: new Date().toISOString()
    }]);
  } catch (e) {
    // لا نفعل شيئاً إذا فشل التسجيل نفسه
  }
}
