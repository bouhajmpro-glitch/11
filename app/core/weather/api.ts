import { WeatherData, CityResult } from './types';

// دوال مساعدة
const formatTime = (iso: string) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
};

const getWeatherDesc = (code: number) => {
  if (code === 0) return "سماء صافية";
  if (code <= 3) return "غائم جزئياً";
  if (code <= 45) return "ضباب";
  if (code <= 55) return "رذاذ";
  if (code <= 65) return "مطر";
  if (code <= 75) return "ثلوج";
  if (code >= 95) return "عاصفة رعدية";
  return "متقلب";
};

// الدالة الرئيسية لجلب البيانات الشاملة
export async function getWeather(lat: number, lon: number, cityName: string): Promise<WeatherData> {
  try {
    // 1. رابط الطقس الأساسي (Weather) + الزراعة + الطاقة
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_gusts_10m,dew_point_2m`
      + `&hourly=temperature_2m,precipitation_probability,weather_code,visibility,uv_index,wind_speed_10m,soil_moisture_0_to_1cm`
      + `&daily=sunrise,sunset,uv_index_max,et0_fao_evapotranspiration`
      + `&timezone=auto`;

    // 2. رابط البحار (Marine) - يعمل فقط قرب السواحل
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&timezone=auto`;

    // تنفيذ الطلبات بالتوازي
    const [resW, resM] = await Promise.all([
      fetch(weatherUrl),
      fetch(marineUrl).catch(() => ({ ok: false, json: async () => ({}) })) // حماية من الفشل
    ]);

    if (!resW.ok) throw new Error('Weather API Error');

    const wData = await resW.json();
    const mData = resM.ok ? await resM.json() : {};

    const c = wData.current;
    const d = wData.daily;
    const h = wData.hourly;
    const m = mData.current || {};
    const idx = new Date().getHours();

    return {
      // الأساسيات
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      windGusts: c.wind_gusts_10m,
      pressure: Math.round(c.pressure_msl),
      description: getWeatherDesc(c.weather_code),
      weatherCode: c.weather_code,
      isDay: c.is_day === 1,
      city: cityName,

      // الفلك
      sunrise: formatTime(d.sunrise[0]),
      sunset: formatTime(d.sunset[0]),
      uvIndex: d.uv_index_max[0],
      moonPhase: "هلال", // (محاكاة مؤقتة)

      // البيئة
      visibility: h.visibility[idx] || 10000,
      cloudCover: c.cloud_cover,
      dewPoint: c.dew_point_2m,

      // الزراعة
      soilMoisture: h.soil_moisture_0_to_1cm[idx] || 0,
      evapotranspiration: d.et0_fao_evapotranspiration[0] || 0,

      // المخاطر
      rainProb: h.precipitation_probability[idx] || 0,
      rainAmount: c.precipitation,
      
      // الساعي (مهم جداً للشريط)
      hourly: {
        time: h.time.slice(idx, idx + 24),
        temp: h.temperature_2m.slice(idx, idx + 24),
        weatherCode: h.weather_code.slice(idx, idx + 24),
        rain: h.precipitation_probability.slice(idx, idx + 24),
        wind: h.wind_speed_10m.slice(idx, idx + 24),
        uvIndex: h.uv_index.slice(idx, idx + 24),
        soilMoisture: h.soil_moisture_0_to_1cm.slice(idx, idx + 24)
      }
    };

  } catch (error) {
    console.error(error);
    // بيانات الطوارئ
    return {
      temp: 0, feelsLike: 0, humidity: 0, windSpeed: 0, windGusts: 0, pressure: 0,
      description: "غير متاح", weatherCode: 0, isDay: true, city: "غير معروف",
      sunrise: "--:--", sunset: "--:--", uvIndex: 0, visibility: 10000, cloudCover: 0, dewPoint: 0, moonPhase: "",
      soilMoisture: 0, evapotranspiration: 0, rainProb: 0, rainAmount: 0,
      hourly: { time: [], temp: [], weatherCode: [], rain: [], wind: [], uvIndex: [], soilMoisture: [] }
    };
  }
}

// دوال الموقع والبحث (ضرورية جداً ولا يجب حذفها)
export async function searchCities(query: string): Promise<CityResult[]> {
  if (query.length < 2) return [];
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=ar&format=json`);
    const d = await r.json();
    if (!d.results) return [];
    return d.results.map((c: any) => ({ id: c.id, name: c.name, latitude: c.latitude, longitude: c.longitude, country: c.country || '' }));
  } catch (e) { return []; }
}

export async function getLocationByIP(): Promise<{ lat: number, lon: number, city: string } | null> {
  try {
    const r = await fetch('https://ipapi.co/json/');
    const d = await r.json();
    if (d.latitude) return { lat: d.latitude, lon: d.longitude, city: d.city || 'موقع تقريبي' };
    return null;
  } catch (e) { return null; }
}

export async function getCityNameFromCoords(lat: number, lon: number): Promise<string> {
  let d = "", c = "";
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar&zoom=18`, { headers: { 'User-Agent': 'WeatherApp/1.0' } });
    const j = await r.json();
    if (j) {
      c = j.address?.town || j.address?.city || "";
      if (j.display_name) d = j.display_name.split(',')[0];
    }
  } catch (e) {}
  if (!c) {
    try {
      const omResp = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=ar&format=json`);
      const omData = await omResp.json();
      if (omData.results && omData.results.length > 0) c = omData.results[0].name;
    } catch (e) {}
  }
  if (d && c && !d.includes(c)) return `${d}، ${c}`;
  return c || d || "موقعك الحالي";
}
