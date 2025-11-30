// app/core/engine/loader.ts
import { DATA_SOURCES } from '../config/sources';
import { logSystemError } from '../system/logger';

export async function bootSystem(lat: number, lon: number) {
  const report: any = { status: 'online', modules: {} };
  
  // تشغيل كل الأنظمة بالتوازي
  const tasks = DATA_SOURCES.map(async (source) => {
    try {
      // محاولة الاتصال (مع مهلة زمنية 5 ثواني فقط)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(source.url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      // نجاح!
      return { id: source.id, data: await res.json(), success: true };

    } catch (e) {
      // فشل! نبلغ القائد ونعزل الجزء المصاب
      await logSystemError(source.name, e);
      return { id: source.id, data: null, success: false };
    }
  });

  const results = await Promise.all(tasks);
  
  // تجميع الأجزاء السليمة فقط
  results.forEach(r => {
    if (r.success) report.modules[r.id] = r.data;
  });

  return report;
}
