// app/weather.ts

export interface HourlyData {
  time: string[];
  temp: number[];
  weatherCode: number[];
  rain: number[];        // احتمالية المطر
  wind: number[];        // سرعة الرياح
  uvIndex: number[];     // UV
  soilMoisture: number[]; // رطوبة التربة
}

export interface WeatherData {
  // الأساسيات
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  pressure: number;
  description: string;
  isDay: boolean;
  city: string;

  // الطبيعة والفلك
  sunrise: string;
  sunset: string;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  dewPoint: number;
  moonPhase: string;

  // المخاطر والزراعة
  rainProb: number;
  soilMoisture: number;
  evapotranspiration: number;

  // البيانات الساعية
  hourly: HourlyData;
}

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

const formatTime = (isoString: string) => {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
};

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

export async function getWeather(lat: number, lon: number, cityName: string): Promise<WeatherData> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,pressure_msl,surface_pressure,wind_speed_10m,wind_gusts_10m,weather_code,cloud_cover,dew_point_2m,precipitation_probability&daily=sunrise,sunset,uv_index_max,et0_fao_evapotranspiration&hourly=temperature_2m,weather_code,visibility,soil_moisture_0_to_1cm,precipitation_probability,wind_speed_10m,uv_index&timezone=auto`
    );

    if (!response.ok) throw new Error('فشل الاتصال');

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    const currentHour = new Date().getHours();

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
      evapotranspiration: daily.et0_fao_evapotranspiration[0] || 0,
      moonPhase: "هلال",
      
      // تجميع البيانات الساعية بدقة (مع حماية المصفوفات)
      hourly: {
        time: hourly.time.slice(currentHour, currentHour + 24),
        temp: hourly.temperature_2m.slice(currentHour, currentHour + 24),
        weatherCode: hourly.weather_code.slice(currentHour, currentHour + 24),
        rain: hourly.precipitation_probability ? hourly.precipitation_probability.slice(currentHour, currentHour + 24) : [],
        wind: hourly.wind_speed_10m ? hourly.wind_speed_10m.slice(currentHour, currentHour + 24) : [],
        uvIndex: hourly.uv_index ? hourly.uv_index.slice(currentHour, currentHour + 24) : [],
        soilMoisture: hourly.soil_moisture_0_to_1cm ? hourly.soil_moisture_0_to_1cm.slice(currentHour, currentHour + 24) : []
      }
    };

  } catch (error) {
    // كائن الأمان
    return {
      temp: 0, feelsLike: 0, humidity: 0, windSpeed: 0, windGusts: 0, pressure: 0,
      description: "غير متاح", isDay: true, city: "غير معروف",
      sunrise: "--:--", sunset: "--:--", uvIndex: 0, visibility: 10000,
      cloudCover: 0, dewPoint: 0, rainProb: 0, soilMoisture: 0, evapotranspiration: 0, moonPhase: "",
      hourly: { time: [], temp: [], weatherCode: [], rain: [], wind: [], uvIndex: [], soilMoisture: [] }
    };
  }
}

// دوال المساعدة (البحث، IP، الاسم)
export async function searchCities(query: string): Promise<CityResult[]> {
  if (query.length < 2) return [];
  try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=ar&format=json`); const d = await r.json(); if (!d.results) return []; return d.results.map((c: any) => ({ id: c.id, name: c.name, latitude: c.latitude, longitude: c.longitude, country: c.country || '' })); } catch (e) { return []; }
}
export async function getLocationByIP(): Promise<{ lat: number, lon: number, city: string } | null> {
  try { const r = await fetch('https://ipapi.co/json/'); const d = await r.json(); if (d.latitude) return { lat: d.latitude, lon: d.longitude, city: d.city || 'موقع تقريبي' }; return null; } catch (e) { return null; }
}
export async function getCityNameFromCoords(lat: number, lon: number): Promise<string> {
  let d = "", c = "";
  try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar&zoom=18`, { headers: { 'User-Agent': 'WeatherApp/1.0' } }); const j = await r.json(); if (j) { c = j.address?.town || j.address?.city || ""; if (j.display_name) d = j.display_name.split(',')[0]; } } catch (e) {}
  if (!c) { try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=ar&format=json`); const j = await r.json(); if (j.results) c = j.results[0].name; } catch (e) {} }
  if (d && c && !d.includes(c)) return `${d}، ${c}`; return c || d || "موقعك الحالي";
}
