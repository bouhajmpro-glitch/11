// app/weather.ts

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number; // هبات الرياح
  pressure: number;
  description: string;
  isDay: boolean;
  city: string;
  sunrise: string;
  sunset: string;
  uvIndex: number;
  visibility: number;
  cloudCover: number; // نسبة الغيوم
  dewPoint: number; // نقطة الندى
  rainProb: number; // احتمالية المطر
  soilMoisture: number; // رطوبة التربة
}

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
};

export async function getWeather(lat: number, lon: number, cityName: string): Promise<WeatherData> {
  try {
    // نطلب الآن "الباقة الكاملة" من البيانات (مجاناً)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,pressure_msl,surface_pressure,wind_speed_10m,wind_gusts_10m,weather_code,cloud_cover,dew_point_2m,precipitation_probability&daily=sunrise,sunset,uv_index_max&hourly=visibility,soil_moisture_0_to_1cm&timezone=auto`
    );

    if (!response.ok) throw new Error('فشل الاتصال');

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    
    const currentHour = new Date().getHours();

    const getWeatherDesc = (code: number) => {
      if (code === 0) return "سماء صافية";
      if (code <= 3) return "غائم جزئياً";
      if (code <= 48) return "ضباب";
      if (code <= 55) return "رذاذ";
      if (code <= 65) return "مطر";
      if (code <= 77) return "ثلوج";
      if (code >= 95) return "عاصفة رعدية";
      return "متقلب";
    };

    return {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windGusts: current.wind_gusts_10m,
      pressure: Math.round(current.surface_pressure),
      description: getWeatherDesc(current.weather_code),
      isDay: current.is_day === 1,
      city: cityName,
      sunrise: formatTime(daily.sunrise[0]),
      sunset: formatTime(daily.sunset[0]),
      uvIndex: daily.uv_index_max[0],
      visibility: hourly.visibility[currentHour] || 10000,
      cloudCover: current.cloud_cover,
      dewPoint: current.dew_point_2m,
      rainProb: current.precipitation_probability || 0,
      soilMoisture: hourly.soil_moisture_0_to_1cm[currentHour] || 0.3,
    };

  } catch (error) {
    console.error(error);
    return {
      temp: 0, feelsLike: 0, humidity: 0, windSpeed: 0, windGusts: 0, pressure: 0,
      description: "غير متاح", isDay: true, city: "غير معروف",
      sunrise: "--:--", sunset: "--:--", uvIndex: 0, visibility: 10000,
      cloudCover: 0, dewPoint: 0, rainProb: 0, soilMoisture: 0
    };
  }
}

// ... (باقي الدوال: searchCities, getLocationByIP, getCityNameFromCoords تبقى كما هي تماماً) ...
// يرجى نسخها من الردود السابقة لضمان عملها (أو سأعيد كتابتها لك إذا أردت الملف كاملاً)
export async function searchCities(query: string): Promise<CityResult[]> {
  if (query.length < 2) return [];
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=ar&format=json`);
    const data = await response.json();
    if (!data.results) return [];
    return data.results.map((city: any) => ({ id: city.id, name: city.name, latitude: city.latitude, longitude: city.longitude, country: city.country || '' }));
  } catch (error) { return []; }
}
export async function getLocationByIP(): Promise<{ lat: number, lon: number, city: string } | null> {
  try { const response = await fetch('https://ipapi.co/json/'); const data = await response.json(); if (data.latitude) return { lat: data.latitude, lon: data.longitude, city: data.city || 'موقع تقريبي' }; return null; } catch (e) { return null; }
}
export async function getCityNameFromCoords(lat: number, lon: number): Promise<string> {
  // (نفس كود Nominatim السابق)
  let displayName = ""; let city = "";
  try {
    const nomResp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar&zoom=18`, { headers: { 'User-Agent': 'WeatherApp/1.0' } });
    const nomData = await nomResp.json();
    if (nomData) {
      city = nomData.address?.town || nomData.address?.city || "";
      if (nomData.display_name) displayName = nomData.display_name.split(',')[0];
    }
  } catch (e) {}
  if (!city) { try { const om = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=ar&format=json`); const d = await om.json(); if (d.results) city = d.results[0].name; } catch (e) {} }
  if (displayName && city && !displayName.includes(city)) return `${displayName}، ${city}`;
  return city || displayName || "موقعك الحالي";
}
