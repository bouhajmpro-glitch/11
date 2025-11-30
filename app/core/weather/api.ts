import { WeatherData, CityResult } from './types';

const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }) : "--:--";

const getWeatherDesc = (code: number) => {
  if (code === 0) return "سماء صافية";
  if (code <= 3) return "غائم جزئياً";
  if (code <= 48) return "ضباب";
  if (code <= 65) return "مطر";
  if (code <= 75) return "ثلوج";
  if (code >= 95) return "عاصفة رعدية";
  return "متقلب";
};

export async function getWeather(lat: number, lon: number, cityName: string): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_gusts_10m,dew_point_2m&hourly=temperature_2m,precipitation_probability,weather_code,visibility,uv_index,wind_speed_10m,soil_moisture_0_to_1cm&daily=sunrise,sunset,uv_index_max,et0_fao_evapotranspiration&timezone=auto`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    
    const c = data.current;
    const d = data.daily;
    const h = data.hourly;
    const idx = new Date().getHours();

    return {
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
      sunrise: formatTime(d.sunrise[0]),
      sunset: formatTime(d.sunset[0]),
      uvIndex: d.uv_index_max[0],
      visibility: h.visibility[idx] || 10000,
      cloudCover: c.cloud_cover,
      dewPoint: c.dew_point_2m,
      rainProb: h.precipitation_probability[idx] || 0,
      soilMoisture: h.soil_moisture_0_to_1cm[idx] || 0,
      evapotranspiration: d.et0_fao_evapotranspiration[0] || 0,
      moonPhase: "هلال",
      hourly: {
        time: h.time.slice(idx, idx + 24),
        temp: h.temperature_2m.slice(idx, idx + 24),
        weatherCode: h.weather_code.slice(idx, idx + 24),
        rain: h.precipitation_probability ? h.precipitation_probability.slice(idx, idx + 24) : [],
        wind: h.wind_speed_10m ? h.wind_speed_10m.slice(idx, idx + 24) : [],
        uvIndex: h.uv_index ? h.uv_index.slice(idx, idx + 24) : [],
        soilMoisture: h.soil_moisture_0_to_1cm ? h.soil_moisture_0_to_1cm.slice(idx, idx + 24) : []
      }
    };
  } catch (e) {
    return {
      temp: 0, feelsLike: 0, humidity: 0, windSpeed: 0, windGusts: 0, pressure: 0, description: "غير متاح", weatherCode: 0, isDay: true, city: "غير معروف",
      sunrise: "-", sunset: "-", uvIndex: 0, visibility: 10000, cloudCover: 0, dewPoint: 0, rainProb: 0, soilMoisture: 0, evapotranspiration: 0, moonPhase: "",
      hourly: { time: [], temp: [], weatherCode: [], rain: [], wind: [], uvIndex: [], soilMoisture: [] }
    };
  }
}

export async function searchCities(query: string): Promise<CityResult[]> {
  try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=ar&format=json`); const d = await r.json(); return d.results || []; } catch { return []; }
}
export async function getLocationByIP(): Promise<{ lat: number, lon: number, city: string } | null> {
  try { const r = await fetch('https://ipapi.co/json/'); const d = await r.json(); return d.latitude ? { lat: d.latitude, lon: d.longitude, city: d.city } : null; } catch { return null; }
}
export async function getCityNameFromCoords(lat: number, lon: number): Promise<string> {
  try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar&zoom=18`, {headers:{'User-Agent':'App/1.0'}}); const d = await r.json(); return d.address?.city || d.address?.town || d.display_name?.split(',')[0] || "موقعك"; } catch { return "موقعك"; }
}
