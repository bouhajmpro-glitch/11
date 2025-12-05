export interface HazardPoint {
  id: string;
  type: 'quake' | 'fire' | 'flood';
  lat: number;
  lon: number;
  magnitude?: number; // للزلازل
  title: string;
  date: string;
}

// 1. خدمة الزلازل (USGS)
export const fetchQuakes = async (): Promise<HazardPoint[]> => {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    const data = await res.json();
    
    return data.features.map((f: any) => ({
      id: f.id,
      type: 'quake',
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      magnitude: f.properties.mag,
      title: f.properties.place,
      date: new Date(f.properties.time).toLocaleTimeString('ar-MA')
    }));
  } catch (e) {
    console.error("USGS Error:", e);
    return [];
  }
};

// 2. خدمة الحرائق (NASA EONET)
export const fetchWildfires = async (): Promise<HazardPoint[]> => {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open');
    const data = await res.json();

    return data.events.map((e: any) => ({
      id: e.id,
      type: 'fire',
      lat: e.geometry[0].coordinates[1],
      lon: e.geometry[0].coordinates[0],
      title: e.title,
      date: new Date(e.geometry[0].date).toLocaleDateString('ar-MA')
    }));
  } catch (e) {
    console.error("NASA Error:", e);
    return [];
  }
};

// 3. خدمة جودة الهواء (WAQI)
export const fetchAirQuality = async (lat: number, lon: number) => {
  try {
    const res = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`);
    const data = await res.json();
    if(data.status === 'ok') return data.data;
    return null;
  } catch (e) {
    return null;
  }
};