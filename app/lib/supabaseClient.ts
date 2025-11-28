import { createClient } from '@supabase/supabase-js';

// 🔴 هام جداً: استبدل النصوص أدناه بالمفاتيح التي نسختها من Supabase

const supabaseUrl = 'https://supabase.com/dashboard/project/urjylvudmgaercnblpao/sql/16c01422-b0a6-4339-981f-4cce5cac7ef2';

const supabaseKey = 'sb_publishable_zv7P7Cahna6tA_qkFedKQA_wFc4YWfF';

export const supabase = createClient(supabaseUrl, supabaseKey);

