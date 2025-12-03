// app/core/config/sources_bd.ts

export interface WeatherSource {
  id: string;
  name: string;
  url: string;
  type: 'global' | 'local' | 'marine' | 'space' | 'special';
  region: 'world' | 'eu' | 'us' | 'asia' | 'sea';
  priority: number;
}

// النسخة الاحتياطية الصلبة (للطوارئ)
const FALLBACK_SOURCES: WeatherSource[] = [
  { id: 'om', name: 'Open-Meteo', url: 'https://api.open-meteo.com', type: 'global', region: 'world', priority: 10 }
];

// ذاكرة حية للمصادر
let ACTIVE_SOURCES: WeatherSource[] = [...FALLBACK_SOURCES];

// دالة التحديث الديناميكي (تستدعى عند بدء التطبيق)
export async function updateSourcesRegistry() {
  try {
    const res = await fetch('/sources.json');
    if (res.ok) {
      const data = await res.json();
      ACTIVE_SOURCES = data.sources;
      console.log(`📡 Sources Engine: Updated with ${ACTIVE_SOURCES.length} sources.`);
    }
  } catch (e) {
    console.warn("Using fallback sources.");
  }
}

// خوارزمية الاختيار الذكي (تستخدم القائمة الحية)
export const selectBestSources = (lat: number, lon: number, isSea: boolean = false): WeatherSource[] => {
  let relevant = ACTIVE_SOURCES.filter(s => s.region === 'world');
  
  if (lat > 30 && lat < 70 && lon > -30 && lon < 40) {
    relevant = [...relevant, ...ACTIVE_SOURCES.filter(s => s.region === 'eu')];
  }
  
  if (lat > 20 && lat < 50 && lon > -130 && lon < -60) {
    relevant = [...relevant, ...ACTIVE_SOURCES.filter(s => s.region === 'us')];
  }

  if (isSea) {
    relevant = [...relevant, ...ACTIVE_SOURCES.filter(s => s.type === 'marine')];
  }

  relevant.sort((a, b) => b.priority - a.priority);
  return relevant.slice(0, 25);
};
