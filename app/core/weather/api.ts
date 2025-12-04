// app/core/weather/api.ts
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_gusts_10m,dew_point_2m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,visibility,uv_index,wind_speed_10m,soil_moisture_0_to_1cm,soil_temperature_0cm,dew_point_2m,pressure_msl,relative_humidity_2m,cloud_cover,wind_direction_10m,wind_gusts_10m,precipitation,rain,showers,snowfall,snow_depth&daily=sunrise,sunset,uv_index_max,et0_fao_evapotranspiration,precipitation_sum,snowfall_sum,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    
    const c = data.current;
    const d = data.daily;
    const h = data.hourly;
    const idx = new Date().getHours();

    // Helper pour éviter les crashs si les tableaux hourly sont vides ou courts
    const sliceData = (arr: any[]) => arr ? arr.slice(idx, idx + 24) : Array(24).fill(0);

    return {
      // --- Basic ---
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      windGusts: c.wind_gusts_10m,
      windDir: c.wind_direction_10m,
      pressure: Math.round(c.pressure_msl),
      pressureSealevel: Math.round(c.surface_pressure || c.pressure_msl), // Fallback
      description: getWeatherDesc(c.weather_code),
      weatherCode: c.weather_code,
      cloudCover: c.cloud_cover, // <--- AJOUTÉ ICI
      isDay: c.is_day === 1,
      city: cityName,
      country: "Global", // Open-Meteo forecast ne donne pas le pays directement ici

      // --- Astronomy ---
      sunrise: formatTime(d.sunrise[0]),
      sunset: formatTime(d.sunset[0]),
      moonPhase: "هلال", // Nécessite un calcul séparé ou API astro
      dayLength: 12, // Placeholder ou calcul à partir de sunrise/sunset

      // --- Bio ---
      uvIndex: d.uv_index_max[0],
      visibility: h.visibility[idx] || 10000,
      dewPoint: c.dew_point_2m,
      airQuality: 50, // Placeholder, nécessite une autre API call
      pollen: 0,
      
      // --- Agro ---
      soilMoisture: h.soil_moisture_0_to_1cm[idx] || 0,
      soilTemp: h.soil_temperature_0cm ? h.soil_temperature_0cm[idx] : 0,
      evapotranspiration: d.et0_fao_evapotranspiration[0] || 0,
      leafWetness: 0,

      // --- Hazards ---
      rainProb: h.precipitation_probability[idx] || 0,
      rainAmount: c.precipitation,
      snowDepth: c.snow_depth || 0,
      freezingRain: false,
      cape: 0,

      // --- Arrays ---
      hourly: {
        time: sliceData(h.time),
        temp: sliceData(h.temperature_2m),
        feelsLike: sliceData(h.apparent_temperature || h.temperature_2m), // Fallback
        pressure: sliceData(h.pressure_msl),
        humidity: sliceData(h.relative_humidity_2m),
        dewPoint: sliceData(h.dew_point_2m),
        uvIndex: sliceData(h.uv_index),
        cloudCover: sliceData(h.cloud_cover),
        visibility: sliceData(h.visibility),
        // CORRECTION DE L'ERREUR WIND ICI : 'wind' -> 'windSpeed'
        windSpeed: sliceData(h.wind_speed_10m), 
        windDir: sliceData(h.wind_direction_10m),
        windGusts: sliceData(h.wind_gusts_10m),
        rain: sliceData(h.precipitation_probability),
        rainAmount: sliceData(h.precipitation),
        snowDepth: sliceData(h.snow_depth),
        snowFall: sliceData(h.snowfall),
        weatherCode: sliceData(h.weather_code),
        soilMoisture: sliceData(h.soil_moisture_0_to_1cm),
        soilTemp: sliceData(h.soil_temperature_0cm)
      },
      daily: {
        time: d.time,
        sunrise: d.sunrise,
        sunset: d.sunset,
        uvIndexMax: d.uv_index_max,
        rainSum: d.precipitation_sum,
        snowSum: d.snowfall_sum,
        maxTemp: d.temperature_2m_max,
        minTemp: d.temperature_2m_min
      }
    };
  } catch (e) {
    console.error("Weather API Error:", e);
    // Objet de secours pour éviter l'écran blanc
    return {
      temp: 0, feelsLike: 0, humidity: 0, windSpeed: 0, windGusts: 0, windDir: 0, pressure: 0, pressureSealevel: 0,
      description: "غير متاح", weatherCode: 0, cloudCover: 0, isDay: true, city: "غير معروف", country: "-",
      sunrise: "-", sunset: "-", moonPhase: "", dayLength: 0, uvIndex: 0, visibility: 10000, dewPoint: 0, airQuality: 0, pollen: 0,
      soilMoisture: 0, soilTemp: 0, evapotranspiration: 0, leafWetness: 0, rainProb: 0, rainAmount: 0, snowDepth: 0, freezingRain: false, cape: 0,
      hourly: { time: [], temp: [], feelsLike: [], pressure: [], humidity: [], dewPoint: [], uvIndex: [], cloudCover: [], visibility: [], windSpeed: [], windDir: [], windGusts: [], rain: [], rainAmount: [], snowDepth: [], snowFall: [], weatherCode: [], soilMoisture: [], soilTemp: [] },
      daily: { time: [], sunrise: [], sunset: [], uvIndexMax: [], rainSum: [], snowSum: [], maxTemp: [], minTemp: [] }
    };
  }
}

// ... Les autres fonctions (searchCities, getLocationByIP) restent inchangées
export async function searchCities(query: string): Promise<CityResult[]> {
  try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=ar&format=json`); const d = await r.json(); return d.results || []; } catch { return []; }
}
export async function getLocationByIP(): Promise<{ lat: number, lon: number, city: string } | null> {
  try { const r = await fetch('https://ipapi.co/json/'); const d = await r.json(); return d.latitude ? { lat: d.latitude, lon: d.longitude, city: d.city } : null; } catch { return null; }
}
export async function getCityNameFromCoords(lat: number, lon: number): Promise<string> {
  try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar&zoom=18`, {headers:{'User-Agent':'App/1.0'}}); const d = await r.json(); return d.address?.city || d.address?.town || "موقعك"; } catch { return "موقعك"; }
}