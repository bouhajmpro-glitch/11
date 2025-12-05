// app/core/weather/gridApi.ts

export interface GridDataPoint {
  lat: number;
  lng: number;
  value: number;
}

// دالة لجلب شبكة بيانات حية للمنطقة المعروضة
export async function fetchWeatherGrid(
  north: number, 
  south: number, 
  east: number, 
  west: number, 
  variable: 'temperature_2m' | 'pressure_msl' | 'cloudcover' = 'temperature_2m'
): Promise<GridDataPoint[]> {
  
  // 1. إنشاء شبكة نقاط (Grid) تغطي الشاشة
  // كلما زاد الرقم زادت الدقة (لكن أصبحت أبطأ). 15x15 ممتاز للأداء.
  const rows = 15; 
  const cols = 15;
  const lats: number[] = [];
  const lngs: number[] = [];

  const latStep = (north - south) / rows;
  const lngStep = (east - west) / cols;

  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      lats.push(south + i * latStep);
      lngs.push(west + j * lngStep);
    }
  }

  // 2. طلب البيانات من Open-Meteo دفعة واحدة
  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lngs.join(','),
    current: variable, // نجلب القيمة الحالية
    timezone: 'auto'
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();

    // 3. تحويل الرد إلى تنسيق قابل للرسم
    const gridData: GridDataPoint[] = [];
    
    if (Array.isArray(data)) {
        data.forEach((point) => {
            gridData.push({
                lat: point.latitude,
                lng: point.longitude,
                value: point.current[variable]
            });
        });
    } else if (data.current) {
        // حالة نقطة واحدة (احتياط)
        gridData.push({
            lat: data.latitude,
            lng: data.longitude,
            value: data.current[variable]
        });
    }

    return gridData;

  } catch (e) {
    console.error("Grid Fetch Error:", e);
    return [];
  }
}