export interface WeatherSource {
    id: string;
    name: string;
    url: string;
    type: 'global' | 'local' | 'marine' | 'space' | 'special';
    region: 'world' | 'eu' | 'us' | 'asia' | 'sea'; // المنطقة المدعومة
    priority: number; // الأهمية (1-10)
  }
  
  export const SOURCES_DB: WeatherSource[] = [
    // --- 1. العمالقة (Global) ---
    { id: 'om', name: 'Open-Meteo', url: 'https://api.open-meteo.com', type: 'global', region: 'world', priority: 10 },
    { id: 'yr', name: 'YR.no (Met.no)', url: 'https://api.met.no/weatherapi', type: 'global', region: 'world', priority: 9 },
    { id: 'owm', name: 'OpenWeatherMap', url: 'https://api.openweathermap.org', type: 'global', region: 'world', priority: 8 },
    { id: 'wapi', name: 'WeatherAPI', url: 'https://api.weatherapi.com', type: 'global', region: 'world', priority: 8 },
    { id: '7timer', name: '7Timer!', url: 'http://www.7timer.info', type: 'global', region: 'world', priority: 7 },
    { id: 'vc', name: 'Visual Crossing', url: 'https://weather.visualcrossing.com', type: 'global', region: 'world', priority: 7 },
    
    // --- 2. المتخصصون (Special) ---
    { id: 'nasa-power', name: 'NASA POWER', url: 'https://power.larc.nasa.gov', type: 'special', region: 'world', priority: 9 },
    { id: 'usgs', name: 'USGS Earthquakes', url: 'https://earthquake.usgs.gov', type: 'special', region: 'world', priority: 9 },
    { id: 'openuv', name: 'OpenUV', url: 'https://api.openuv.io', type: 'special', region: 'world', priority: 8 },
    { id: 'waqi', name: 'World Air Quality', url: 'https://api.waqi.info', type: 'special', region: 'world', priority: 8 },
    
    // --- 3. البحار (Marine) ---
    { id: 'marine-om', name: 'Open-Meteo Marine', url: 'https://marine-api.open-meteo.com', type: 'marine', region: 'sea', priority: 9 },
    { id: 'stormglass', name: 'StormGlass', url: 'https://api.stormglass.io', type: 'marine', region: 'sea', priority: 7 },
    
    // --- 4. الفضاء (Space) ---
    { id: 'nasa-donki', name: 'NASA DONKI', url: 'https://api.nasa.gov/DONKI', type: 'space', region: 'world', priority: 8 },
    { id: 'nasa-neo', name: 'NASA NeoWs', url: 'https://api.nasa.gov/neo', type: 'space', region: 'world', priority: 7 },
    
    // --- 5. محلي (Local - Europe) ---
    { id: 'dwd', name: 'DWD Germany', url: 'https://api.brightsky.dev', type: 'local', region: 'eu', priority: 9 },
    { id: 'meteo-france', name: 'Meteo France', url: 'https://public-api.meteofrance.fr', type: 'local', region: 'eu', priority: 8 },
    
    // --- 6. محلي (Local - US) ---
    { id: 'nws', name: 'NWS NOAA', url: 'https://api.weather.gov', type: 'local', region: 'us', priority: 9 },
    
    // ... (يمكن إضافة الـ 80 الباقية هنا بنفس النمط)
  ];
  
  // خوارزمية الاختيار الذكي (The Selector)
  export const selectBestSources = (lat: number, lon: number, isSea: boolean = false): WeatherSource[] => {
    // 1. تصفية حسب المنطقة
    let relevant = SOURCES_DB.filter(s => s.region === 'world');
    
    // إضافة الأوروبي إذا كنا في أوروبا (تقريبياً)
    if (lat > 30 && lat < 70 && lon > -30 && lon < 40) {
      relevant = [...relevant, ...SOURCES_DB.filter(s => s.region === 'eu')];
    }
    
    // إضافة الأمريكي إذا كنا في أمريكا
    if (lat > 20 && lat < 50 && lon > -130 && lon < -60) {
      relevant = [...relevant, ...SOURCES_DB.filter(s => s.region === 'us')];
    }
  
    // إضافة البحري إذا كنا في البحر
    if (isSea) {
      relevant = [...relevant, ...SOURCES_DB.filter(s => s.type === 'marine')];
    }
  
    // 2. الترتيب حسب الأولوية
    relevant.sort((a, b) => b.priority - a.priority);
  
    // 3. إرجاع أفضل 25
    return relevant.slice(0, 25);
  };
  