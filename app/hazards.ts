// app/hazards.ts

export type HazardType = 'earthquake' | 'storm' | 'space' | 'science' | 'research' | 'breaking';

export interface Hazard {
  id: string;
  title: string;
  details?: string;
  url?: string;
  type: HazardType;
  severity: 'info' | 'warning' | 'critical';
  date: string;
  source: string;
}

const researchNews = [
  { t: "دراسة: المحيطات تمتص حرارة تفوق المتوقع", d: "كشفت دراسة جديدة أن قدرة المحيطات على امتصاص الكربون قد تكون أعلى بـ 20% مما كان يعتقد سابقاً." },
  { t: "تقرير: 2024 يسجل أرقاماً قياسية", d: "بيانات الأقمار الصناعية تؤكد كسر حاجز 1.5 درجة مئوية للاحتباس الحراري." }
];

// دالة تعريب الأماكن
const translatePlace = (place: string) => {
  if (!place) return "موقع غير محدد";
  return place.replace('of', 'من').replace('South', 'جنوب').replace('North', 'شمال')
    .replace('East', 'شرق').replace('West', 'غرب').replace('Region', 'منطقة');
};

// 1. زلازل USGS
async function fetchEarthquakes(): Promise<Hazard[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).slice(0, 2).map((f: any) => {
      const mag = f.properties.mag;
      let severity: Hazard['severity'] = 'info';
      if (mag > 5.5) severity = 'warning';
      if (mag > 6.5) severity = 'critical';
      return {
        id: f.id,
        title: `زلزال بقوة ${mag} يضرب ${translatePlace(f.properties.place)}`,
        details: `العمق: ${f.geometry[2]} كم.`,
        url: f.properties.url,
        type: 'earthquake',
        severity,
        source: 'USGS Live',
        date: new Date(f.properties.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    });
  } catch (e) { return []; }
}

// 2. الفضاء
async function fetchSpaceWeather(): Promise<Hazard[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.nasa.gov/DONKI/GST?startDate=${today}&api_key=DEMO_KEY`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 1).map((event: any) => ({
      id: event.gstID,
      title: `عاصفة شمسية (KP-${event.allKpIndex})`,
      details: "نشاط شمسي قد يؤثر على الاتصالات.",
      url: event.link,
      type: 'space',
      severity: event.allKpIndex > 5 ? 'warning' : 'info',
      source: 'NASA Space',
      date: event.startTime || ''
    }));
  } catch (e) { return []; }
}

// المحرك الموحد
export async function getGlobalHazards(): Promise<Hazard[]> {
  try {
    const [quakes, space] = await Promise.all([fetchEarthquakes(), fetchSpaceWeather()]);
    
    const rand = researchNews[Math.floor(Math.random() * researchNews.length)];
    const randomResearch: Hazard = {
      id: `res-${Date.now()}`,
      title: rand.t,
      details: rand.d,
      url: `https://www.google.com/search?q=${encodeURIComponent(rand.t)}`,
      type: 'research',
      severity: 'info',
      source: 'ScienceDaily',
      date: new Date().toLocaleDateString('en-US')
    };

    const all = [...quakes, ...space, randomResearch];
    return all.sort((a, b) => (b.severity === 'critical' ? 1 : 0) - (a.severity === 'critical' ? 1 : 0));
  } catch (e) {
    return [];
  }
}
