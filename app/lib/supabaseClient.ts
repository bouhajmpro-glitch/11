// app/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// رابط مشروعك الصحيح (تم استخراجه من الرابط الذي أرسلته)
const supabaseUrl = 'https://urjylvudmgaercnblpao.supabase.co';

// مفتاحك العام
const supabaseKey = 'sb_publishable_zv7P7Cahna6tA_qkFedKQA_wFc4YWfF';

export const supabase = createClient(supabaseUrl, supabaseKey);
