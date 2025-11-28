// app/hazards.ts

export interface Hazard {
    id: string;
    place: string;
    mag: number; // القوة (ريختر)
    time: number;
    url: string;
    type: 'earthquake' | 'flood' | 'storm';
  }
  
  // جلب الزلازل من USGS (مجاني ومفتوح)
  export async function getRecentEarthquakes(): Promise<Hazard[]> {
    try {
      // نطلب الزلازل فوق 2.5 درجة في آخر 24 ساعة
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
      const data = await response.json();
      
      if (!data.features) return [];
  
      return data.features.slice(0, 5).map((feature: any) => ({
        id: feature.id,
        place: translatePlace(feature.properties.place), // سنحاول ترجمة المكان
        mag: feature.properties.mag,
        time: feature.properties.time,
        url: feature.properties.url,
        type: 'earthquake'
      }));
    } catch (e) {
      console.error("Earthquake API Error", e);
      return [];
    }
  }
  
  // دالة بسيطة لتعريب الأسماء (تحسين مستقبلي: يمكن ربطها بـ API ترجمة)
  const translatePlace = (place: string) => {
    if (!place) return "موقع غير محدد";
    // ترجمة بسيطة للاتجاهات
    return place
      .replace(' of ', ' من ')
      .replace('South', 'جنوب')
      .replace('North', 'شمال')
      .replace('East', 'شرق')
      .replace('West', 'غرب')
      .replace('km', 'كم');
  };
  