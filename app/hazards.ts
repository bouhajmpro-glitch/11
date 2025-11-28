// ============================================================================
// ملف: app/hazards.ts
// الوظيفة: جلب الأخبار والكوارث من المصادر العالمية (ناسا، USGS)
// ============================================================================

export interface Hazard {
    id: string;
    title: string;
    type: 'earthquake' | 'storm' | 'space' | 'science' | 'research' | 'breaking';
    severity: 'info' | 'warning' | 'critical';
    date: string;
    source: string;
  }
  
  // --- 1. قاعدة بيانات "محتوى الإثراء" (مخزنة محلياً للسرعة) ---
  const researchNews = [
    "دراسة: المحيطات تمتص حرارة تفوق المتوقع.",
    "تقرير: 2024 يسجل أرقاماً قياسية في الحرارة.",
    "اكتشاف تيار محيطي جديد يؤثر على المناخ.",
    "بحث: الغابات الحضرية تقلل الحرارة بـ 4 درجات."
  ];
  
  const phenomena = [
    "رصد سحب 'الماماتوس' النادرة في أوروبا.",
    "ظاهرة الشفق القطبي تظهر في مناطق غير معتادة.",
    "ارتفاع حرارة شمال الأطلسي يثير قلق العلماء."
  ];
  
  // --- 2. وظيفة جلب الزلازل (USGS API) ---
  async function fetchEarthquakes(): Promise<Hazard[]> {
    try {
      // نطلب الزلازل المؤثرة (> 4.5) في آخر يوم
      const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
      const data = await res.json();
      
      return data.features.slice(0, 2).map((f: any) => {
        const mag = f.properties.mag;
        // تحديد مستوى الخطر
        let severity: Hazard['severity'] = 'info';
        if (mag > 5.5) severity = 'warning';
        if (mag > 6.5) severity = 'critical';
  
        return {
          id: f.id,
          title: `زلزال بقوة ${mag} يضرب ${translatePlace(f.properties.place)}`,
          type: 'earthquake',
          severity,
          source: 'USGS Live',
          date: new Date(f.properties.time).toLocaleTimeString('ar-MA')
        };
      });
    } catch (e) { return []; }
  }
  
  // --- 3. وظيفة جلب طقس الفضاء (NASA API) ---
  async function fetchSpaceWeather(): Promise<Hazard[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      // نستخدم رابط تجريبي (Demo) للأحداث الجيومغناطيسية
      const res = await fetch(`https://api.nasa.gov/DONKI/GST?startDate=${today}&api_key=DEMO_KEY`);
      const data = await res.json();
      
      if (!Array.isArray(data)) return [];
  
      return data.slice(0, 1).map((event: any) => ({
        id: event.gstID,
        title: `عاصفة شمسية (KP-${event.allKpIndex}) قد تؤثر على الاتصالات`,
        type: 'space',
        severity: event.allKpIndex > 5 ? 'warning' : 'info',
        source: 'NASA Space',
        date: event.startTime
      }));
    } catch (e) { return []; }
  }
  
  // --- 4. المحرك الرئيسي الموحد (يجمع كل شيء) ---
  export async function getGlobalHazards(): Promise<Hazard[]> {
    // تشغيل الطلبات بالتوازي للسرعة
    const [quakes, space] = await Promise.all([fetchEarthquakes(), fetchSpaceWeather()]);
    
    // إضافة خبر علمي عشوائي
    const randomResearch: Hazard = {
      id: `res-${Date.now()}`,
      title: `🔬 علم: ${researchNews[Math.floor(Math.random() * researchNews.length)]}`,
      type: 'research',
      severity: 'info',
      source: 'ScienceDaily',
      date: ''
    };
  
    // إضافة ظاهرة غريبة عشوائية
    const randomPhenomenon: Hazard = {
      id: `phen-${Date.now()}`,
      title: `🌍 رصد: ${phenomena[Math.floor(Math.random() * phenomena.length)]}`,
      type: 'science',
      severity: 'info',
      source: 'WeatherArchives',
      date: ''
    };
  
    // دمج الكل وترتيبه حسب الخطورة
    const all = [...quakes, ...space, randomResearch, randomPhenomenon];
    
    return all.sort((a, b) => {
      const score = { critical: 3, warning: 2, info: 1 };
      return score[b.severity] - score[a.severity];
    });
  }
  
  // دالة تعريب الأماكن
  const translatePlace = (place: string) => {
    return place.replace('of', 'من').replace('South', 'جنوب').replace('North', 'شمال')
      .replace('East', 'شرق').replace('West', 'غرب').replace('Region', 'منطقة')
      .replace('Island', 'جزيرة').replace('Coast', 'ساحل');
  };
  