import { WeatherData, NewsItem } from '../weather/types';

export interface InsightItem {
  key: string;
  title: string;
  val: string;
  iconName: string;
  color: string;
}

// دالة جديدة لتوليد شريط الأخبار الذكي
export function generateNewsFeed(data: any): NewsItem[] {
  const news: NewsItem[] = [];

  // 1. الإنذارات الرسمية (من WeatherAPI)
  if (data.alerts && data.alerts.length > 0) {
    data.alerts.forEach((alert: any) => {
      news.push({
        type: 'danger',
        text: `إنذار رسمي: ${alert.headline || alert.event} - ${alert.desc || ''}`.substring(0, 100) + '...',
        source: alert.source || 'الأرصاد الحكومية'
      });
    });
  }

  // 2. أخبار الفضاء والفلك (Science & Space)
  if (data.moonPhase.includes('New') && data.cloudCover < 20) {
    news.push({ type: 'space', text: 'فلك: الليلة مظلمة وصافية، مثالية لرصد مجرة درب التبانة والكواكب.', source: 'مرصد الفلك' });
  } else if (data.moonPhase.includes('Full')) {
    news.push({ type: 'space', text: 'فلك: قمر مكتمل الليلة، ظاهرة المد والجزر ستكون في ذروتها.', source: 'علوم البحار' });
  }
  
  if (data.uvIndex > 8) {
    news.push({ type: 'space', text: 'ناسا: نشاط شمسي مرتفع اليوم. الغلاف الجوي يتلقى إشعاعات UV عالية.', source: 'NASA Data' });
  }

  // 3. دراسات وأبحاث (Research)
  if (data.pressure < 1005) {
    news.push({ type: 'science', text: 'طب: انخفاض الضغط الجوي الحالي قد يرتبط بزيادة نوبات الصداع النصفي.', source: 'Journal of Neurology' });
  }
  if (data.airQuality > 100) {
    news.push({ type: 'science', text: 'بيئة: جودة الهواء غير صحية. الدراسات تنصح بارتداء قناع لمرضى الربو.', source: 'WHO Guidelines' });
  }
  
  // 4. تحذيرات محلية مولدة (Local Analysis)
  if (data.windSpeed > 40) {
    news.push({ type: 'danger', text: 'تحذير محلي: سرعة الرياح تتجاوز 40 كم/س، يرجى تثبيت الأشياء القابلة للتطاير.', source: 'نظام التحليل الذري' });
  }
  if (data.rainProb > 70) {
    news.push({ type: 'info', text: 'توقعات: أمطار غزيرة محتملة. تأكد من سلامة مساحات السيارة.', source: 'تحليل السحب' });
  }

  // خبر افتراضي إذا لم يوجد شيء
  if (news.length === 0) {
    news.push({ type: 'info', text: 'استقرار جوي عام في منطقتكم. استمتع بيومك!', source: 'النظام' });
  }

  return news;
}

export function generateInsights(data: WeatherData): InsightItem[] {
  const isRain = data.rainProb > 40 || data.rainAmount > 0.5;
  const isWindy = data.windSpeed > 25;
  const isGusty = data.windGusts > 40;
  const isHumid = data.humidity > 70;
  const isCold = data.temp < 12;
  const isHot = data.temp > 30;
  const badAir = data.airQuality > 100;
  const isStormy = data.weatherCode >= 95;

  const insights: InsightItem[] = [
    { key: 'driving', title: "القيادة", iconName: "Car", val: (data.visibility < 2000 || isRain) ? "حذر مطلوب" : "آمنة", color: (data.visibility < 2000 || isRain) ? "text-red-400" : "text-green-400" },
    { key: 'laundry', title: "الغسيل", iconName: "Shirt", val: (isRain || isHumid) ? "مجفف فقط" : "نشر سريع", color: (isRain || isHumid) ? "text-blue-400" : "text-yellow-400" },
    { key: 'bbq', title: "الشواء", iconName: "Flame", val: (isRain || isWindy) ? "غير مناسب" : "ممتاز", color: (isRain || isWindy) ? "text-orange-300" : "text-orange-500" },
    { key: 'joints', title: "المفاصل", iconName: "HeartPulse", val: (data.pressure < 1005 || (isHumid && isCold)) ? "ألم محتمل" : "مريح", color: (data.pressure < 1005) ? "text-pink-400" : "text-green-300" },
    { key: 'migraine', title: "الصداع", iconName: "Activity", val: (data.uvIndex > 7 || data.pressure < 1000 || isStormy) ? "خطر عالِ" : "منخفض", color: (data.uvIndex > 7) ? "text-purple-400" : "text-blue-300" },
    { key: 'frizz', title: "الشعر", iconName: "Smile", val: (data.humidity > 60 || data.dewPoint > 20) ? "تجعد عالِ" : "جيد", color: (data.humidity > 60) ? "text-yellow-600" : "text-green-400" },
    { key: 'mosquito', title: "البعوض", iconName: "Bug", val: (data.temp > 20 && data.humidity > 50 && !isWindy) ? "نشط" : "خامل", color: "text-red-400" },
    { key: 'flu', title: "الإنفلونزا", iconName: "Thermometer", val: (isCold || (data.temp - data.feelsLike > 5)) ? "خطر البرد" : "منخفض", color: isCold ? "text-red-300" : "text-green-400" },
    { key: 'dust', title: "الغبار", iconName: "CloudFog", val: (badAir || data.visibility < 5000) ? "عالِ" : "نقي", color: badAir ? "text-red-500" : "text-slate-300" },
    { key: 'fishing', title: "الصيد", iconName: "Fish", val: (data.pressure > 1012 && data.pressure < 1020) ? "ممتاز" : "عادي", color: "text-teal-400" },
    { key: 'camping', title: "التخييم", iconName: "Tent", val: (isRain || isCold || isGusty) ? "صعب" : "رائع", color: "text-emerald-500" },
    { key: 'pool', title: "السباحة", iconName: "Waves", val: (data.temp > 26 && data.uvIndex < 9 && !isRain) ? "مناسب" : "غير مفضل", color: "text-blue-500" },
    { key: 'cycling', title: "الدراجة", iconName: "Bike", val: (isWindy || badAir) ? "شاق" : "ممتع", color: "text-green-500" },
    { key: 'running', title: "الركض", iconName: "Dumbbell", val: (badAir) ? "داخلي" : (isHot ? "صباحاً" : "الآن"), color: badAir ? "text-red-400" : "text-orange-400" },
    { key: 'dogs', title: "الكلاب", iconName: "Dog", val: (data.temp > 30) ? "احذر الأسفلت" : "ممتع", color: "text-amber-700" },
    { key: 'garden', title: "الحديقة", iconName: "Leaf", val: (data.soilMoisture > 0.35 || isRain) ? "مكتفية" : "اسقِ الآن", color: "text-green-600" },
    { key: 'cafe', title: "المقهى", iconName: "Coffee", val: (isHot || isRain || isWindy) ? "داخلي" : "تراس", color: "text-amber-800" },
    { key: 'construction', title: "البناء", iconName: "Hammer", val: (isRain || isGusty || isHot) ? "توقف" : "مناسب", color: "text-gray-400" },
    { key: 'photo', title: "التصوير", iconName: "Camera", val: (data.cloudCover > 20 && data.cloudCover < 80) ? "إضاءة ناعمة" : "عادي", color: "text-purple-300" },
    { key: 'drone', title: "الدرون", iconName: "Plane", val: (data.windSpeed > 20 || data.windGusts > 30) ? "خطر" : "آمن", color: "text-sky-500" },
    { key: 'hike', title: "التنزه", iconName: "TreeDeciduous", val: (isRain || data.soilMoisture > 0.4) ? "موحل" : "رائع", color: "text-green-400" },
    { key: 'kids', title: "الأطفال", iconName: "Baby", val: (data.uvIndex > 7) ? "قبعة/ظل" : "لعب خارجي", color: "text-pink-400" },
    { key: 'sailing', title: "الإبحار", iconName: "Anchor", val: (isGusty || isStormy) ? "خطر" : "جيد", color: "text-blue-500" },
    { key: 'stars', title: "الفلك", iconName: "Star", val: (data.cloudCover < 15) ? "مثالي" : "محجوبة", color: "text-indigo-300" }
  ];

  return insights;
}