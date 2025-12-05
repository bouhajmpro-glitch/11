// app/core/weather/gridApi.ts

// تعريف شكل نقطة البيانات في الشبكة
export interface GridDataPoint {
    lat: number;
    lng: number;
    value: number;
  }
  
  // دالة لجلب شبكة من البيانات الحقيقية بناءً على حدود الخريطة
  export async function fetchWeatherGrid(
    north: number, 
    south: number, 
    east: number, 
    west: number, 
    variable: 'temperature_2m' | 'pressure_msl' | 'cloudcover' = 'temperature_2m'
  ): Promise<GridDataPoint[]> {
    
    // 1. تحديد كثافة الشبكة (Resolution)
    // نقوم بتقسيم الشاشة إلى شبكة 10x10 للحصول على نقاط قياس موزعة
    const rows = 15; // دقة عمودية
    const cols = 15; // دقة أفقية
    const lats: number[] = [];
    const lngs: number[] = [];
  
    const latStep = (north - south) / rows;
    const lngStep = (east - west) / cols;
  
    // توليد الإحداثيات
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        lats.push(south + i * latStep);
        lngs.push(west + j * lngStep);
      }
    }
  
    // 2. بناء رابط Open-Meteo لطلب بيانات متعددة في آن واحد
    // هذا يوفر استهلاك الإنترنت ويجلب بيانات دقيقة للمنطقة الظاهرة فقط
    const params = new URLSearchParams({
      latitude: lats.join(','),
      longitude: lngs.join(','),
      current: variable, // نجلب القيمة الحالية فقط
      timezone: 'auto'
    });
  
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!res.ok) throw new Error("Grid Data Fetch Failed");
      const data = await res.json();
  
      // 3. تحويل البيانات القادمة إلى مصفوفة نقاط
      const gridData: GridDataPoint[] = [];
      
      // Open-Meteo يعيد مصفوفة من النتائج عند طلب عدة نقاط
      if (Array.isArray(data)) {
          data.forEach((point, index) => {
              gridData.push({
                  lat: point.latitude,
                  lng: point.longitude,
                  value: point.current[variable]
              });
          });
      } else {
          // حالة احتياطية لو عادت نقطة واحدة
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