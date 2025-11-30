// app/core/config/registry.ts

export interface DataSource {
    id: string;
    name: string;
    category: 'meteo' | 'space' | 'disaster' | 'marine' | 'bio';
    endpoint: string;
    params: Record<string, string>;
    parser: string; // اسم الدالة التي ستعالج البيانات
  }
  
  // القائمة الضخمة الأولية
  export const INITIAL_REGISTRY: DataSource[] = [
    // 1. الطقس الأساسي (Open-Meteo)
    {
      id: 'om-core',
      name: 'Open-Meteo Global',
      category: 'meteo',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      params: {
        current: 'temperature_2m,weather_code,wind_speed_10m',
        timezone: 'auto'
      },
      parser: 'parseOpenMeteo'
    },
    
    // 2. الزلازل (USGS) - مصدر جديد
    {
      id: 'usgs-quakes',
      name: 'USGS Seismic Network',
      category: 'disaster',
      endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      params: {},
      parser: 'parseGeoJSON'
    },
  
    // 3. الكوارث العالمية (GDACS) - مصدر جديد
    {
      id: 'gdacs-alerts',
      name: 'Global Disaster Alerts',
      category: 'disaster',
      endpoint: 'https://www.gdacs.org/xml/rss.xml',
      params: {},
      parser: 'parseRSS'
    },
  
    // 4. طقس الفضاء (NASA DONKI) - مصدر جديد
    {
      id: 'nasa-solar',
      name: 'NASA Space Weather',
      category: 'space',
      endpoint: 'https://api.nasa.gov/DONKI/GST',
      params: { api_key: 'DEMO_KEY' },
      parser: 'parseNASA'
    },
  
    // 5. جودة الهواء الأرضية (WAQI) - مصدر جديد
    {
      id: 'waqi-ground',
      name: 'World Air Quality Index',
      category: 'bio',
      endpoint: 'https://api.waqi.info/feed/geo:', // يحتاج إحداثيات
      params: { token: 'demo' }, // يحتاج مفتاح مجاني
      parser: 'parseWAQI'
    }
  ];
  
  // دالة لجلب السجل المحدث من GitHub (المستقبل)
  export async function fetchLiveRegistry() {
    try {
      // مستقبلاً: سنضع رابط ملف JSON الخام هنا
      // const res = await fetch('https://raw.githubusercontent.com/USER/REPO/main/registry.json');
      // return await res.json();
      return INITIAL_REGISTRY;
    } catch (e) {
      return INITIAL_REGISTRY;
    }
  }
  