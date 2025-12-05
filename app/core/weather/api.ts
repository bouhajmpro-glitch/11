import { WeatherData, CityResult, NewsItem } from './types';
import { generateNewsFeed } from '../analysis/insights';

const WAPI_KEY = '41e414a1fad844269ca185714250412';

// --- تنسيق الوقت ---
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

const mapWapiCodeToOm = (code: number): number => {
    if (code === 1000) return 0;
    if (code === 1003) return 1;
    if (code === 1006) return 3;
    if (code === 1063 || code === 1183) return 61;
    if (code >= 1273) return 95;
    return 3;
};

// --- خوارزميات الذكاء ---
function calculateConfidence(vals: number[]): number {
  if (!vals.length) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
  const deviation = Math.sqrt(variance);
  let confidence = 100 - (deviation * 10);
  return Math.max(Math.min(Math.round(confidence), 100), 40);
}

function calculateWeightedAvg(models: {val: number, weight: number}[]): number {
  let totalVal = 0;
  let totalWeight = 0;
  models.forEach(m => {
    if (m.val !== undefined && !isNaN(m.val)) {
      totalVal += m.val * m.weight;
      totalWeight += m.weight;
    }
  });
  return totalWeight > 0 ? Math.round(totalVal / totalWeight) : 0;
}

// =========================================================
// 1. دوال البيانات الشبكية والزمنية (The Engine Core)
// =========================================================

// أ) جلب توقيتات الرادار الرسمية (لحل مشكلة اختفاء الصور)
export async function fetchRadarTimestamps() {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data = await res.json();
    return {
      past: data.radar?.past || [],
      nowcast: data.radar?.nowcast || [],
      satellite: data.satellite?.infrared || []
    };
  } catch (e) {
    console.error("Radar API Error", e);
    return null;
  }
}

// ب) جلب الخط الزمني الموحد
export async function fetchUnifiedTimeline() {
  try {
    const radarData = await fetchRadarTimestamps();
    if (!radarData) return [];
    
    const frames = [
      ...(radarData.past || []).map((f: any) => ({ ts: f.time, source: 'Radar' })),
      ...(radarData.nowcast || []).map((f: any) => ({ ts: f.time, source: 'Forecast' }))
    ];
    
    return frames.sort((a: any, b: any) => a.ts - b.ts);
  } catch (e) {
    return [];
  }
}

// ج) تعريف نقطة البيانات للرسم
export interface GridDataPoint {
  lat: number;
  lng: number;
  value: number;
}

// د) جلب شبكة بيانات حية (للرسم اليدوي بدل الصور)
export async function fetchWeatherGrid(
  north: number, 
  south: number, 
  east: number, 
  west: number, 
  variable: 'temperature_2m' | 'pressure_msl' | 'cloudcover' = 'temperature_2m'
): Promise<GridDataPoint[]> {
  
  // دقة الشبكة (كلما زاد الرقم زادت الدقة وزاد الحمل)
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

  // نطلب البيانات دفعة واحدة
  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lngs.join(','),
    current: variable,
    timezone: 'auto'
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const gridData: GridDataPoint[] = [];
    
    if (Array.isArray(data)) {
        data.forEach((point) => {
            gridData.push({
                lat: point.latitude,
                lng: point.longitude,
                value: point.current[variable]
            });
        });
    }
    return gridData;
  } catch (e) {
    console.error("Grid Fetch Error:", e);
    return [];
  }
}

// هـ) جلب بيانات الرياح
export async function getWindData() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/onaci/leaflet-velocity/master/demo/wind-global.json');
    if (!res.ok) throw new Error("Wind Data Failed");
    return await res.json();
  } catch (e) {
    console.error("Wind Fetch Error:", e);
    return null;
  }
}

// دالة لاحتياجات التوافق (مطلوبة للصفحة)
export async function fetchGridTimeSeries(bounds: any) {
    return []; // (غير مستخدمة حالياً لأننا نستخدم fetchWeatherGrid المباشرة)
}

// =========================================================
// 2. الدوال التقليدية (للمقارنة والطقس العادي)
// =========================================================
export async function getModelsData(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m&models=ecmwf_ifs04,gfs_seamless,icon_global,gem_global,bom_access_global,meteofrance_arpege_world&forecast_days=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Models Fetch Failed");
    const data = await res.json();
    const idx = new Date().getHours();
    const h = data.hourly;
    const getVal = (modelKey: string, param: string) => {
       const key = `${param}_${modelKey}`;
       return (h && h[key] && h[key][idx] !== undefined) ? h[key][idx] : 0;
    };

    const models = {
      ecmwf: { temp: getVal('ecmwf_ifs04', 'temperature_2m'), rain: getVal('ecmwf_ifs04', 'precipitation_probability'), wind: getVal('ecmwf_ifs04', 'wind_speed_10m') },
      gfs: { temp: getVal('gfs_seamless', 'temperature_2m'), rain: getVal('gfs_seamless', 'precipitation_probability'), wind: getVal('gfs_seamless', 'wind_speed_10m') },
      icon: { temp: getVal('icon_global', 'temperature_2m'), rain: getVal('icon_global', 'precipitation_probability'), wind: getVal('icon_global', 'wind_speed_10m') },
      gem: { temp: getVal('gem_global', 'temperature_2m'), rain: getVal('gem_global', 'precipitation_probability'), wind: getVal('gem_global', 'wind_speed_10m') },
      bom: { temp: getVal('bom_access_global', 'temperature_2m'), rain: getVal('bom_access_global', 'precipitation_probability'), wind: getVal('bom_access_global', 'wind_speed_10m') },
      arpege: { temp: getVal('meteofrance_arpege_world', 'temperature_2m'), rain: getVal('meteofrance_arpege_world', 'precipitation_probability'), wind: getVal('meteofrance_arpege_world', 'wind_speed_10m') },
    };

    const hybridTemp = calculateWeightedAvg([
      { val: models.ecmwf.temp, weight: 0.35 },
      { val: models.gfs.temp, weight: 0.20 },
      { val: models.icon.temp, weight: 0.15 },
      { val: models.arpege.temp, weight: 0.15 },
      { val: models.gem.temp, weight: 0.10 },
      { val: models.bom.temp, weight: 0.05 },
    ]);

    const temps = Object.values(models).map((m: any) => m.temp);
    const deviation = Math.sqrt(temps.reduce((sum, val) => sum + Math.pow(val - hybridTemp, 2), 0) / temps.length);
    const confidenceScore = Math.max(Math.min(Math.round(100 - (deviation * 15)), 100), 30);

    return { score: confidenceScore, hybridTemp, ...models };
  } catch (e) { return null; }
}

// دوال الجلب المساعدة الداخلية
async function fetchOpenMeteo(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_gusts_10m,dew_point_2m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,visibility,uv_index,wind_speed_10m,soil_moisture_0_to_1cm,soil_temperature_0cm,dew_point_2m,pressure_msl,relative_humidity_2m,cloud_cover,wind_direction_10m,wind_gusts_10m,precipitation,rain,showers,snowfall,snow_depth&daily=sunrise,sunset,uv_index_max,et0_fao_evapotranspiration,precipitation_sum,snowfall_sum,temperature_2m_max,temperature_2m_min&minutely_15=temperature_2m,precipitation&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OM_FAIL');
  return await res.json();
}

async function fetchWeatherAPI(lat: number, lon: number) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${WAPI_KEY}&q=${lat},${lon}&days=3&aqi=yes&alerts=yes&lang=ar`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('WAPI_FAIL');
  return await res.json();
}

export async function getWeather(lat: number, lon: number, cityName: string): Promise<WeatherData> {
  try {
    const [omResult, wapiResult] = await Promise.allSettled([
      fetchOpenMeteo(lat, lon),
      fetchWeatherAPI(lat, lon)
    ]);

    const omData = omResult.status === 'fulfilled' ? omResult.value : null;
    const wapiData = wapiResult.status === 'fulfilled' ? wapiResult.value : null;

    if (!omData && !wapiData) throw new Error("All Weather Services Failed");

    const c = omData?.current;
    const d = omData?.daily;
    const h = omData?.hourly;
    const m15 = omData?.minutely_15;
    const wc = wapiData?.current;
    const wf = wapiData?.forecast?.forecastday?.[0];
    const wAlerts = wapiData?.alerts?.alert || [];

    const idx = new Date().getHours();
    const safeSlice = (arr: any[]) => arr ? arr.slice(idx, idx + 24) : Array(24).fill(0);
    const index15 = Math.floor((new Date().getHours() * 60 + new Date().getMinutes()) / 15);
    const safeSlice15 = (arr: any[]) => arr ? arr.slice(index15, index15 + 12) : Array(12).fill(0);
    const getAvg = (v1: number, v2: number) => (v1 !== undefined && v2 !== undefined) ? Math.round((v1 + v2) / 2) : (v1 !== undefined ? v1 : v2);
    const getMax = (v1: number, v2: number) => Math.max(v1 || 0, v2 || 0);

    const tempDataForNews = {
      temp: getAvg(c?.temperature_2m, wc?.temp_c),
      windSpeed: getMax(c?.wind_speed_10m, wc?.wind_kph),
      uvIndex: getMax(d?.uv_index_max?.[0], wc?.uv),
      pressure: Math.round(c?.pressure_msl || wc?.pressure_mb),
      moonPhase: wf?.astro?.moon_phase || "Unknown",
      cloudCover: getAvg(c?.cloud_cover, wc?.cloud),
      rainProb: getMax(h?.precipitation_probability?.[idx], wf?.day?.daily_chance_of_rain),
      airQuality: wc?.air_quality?.["us-epa-index"] || 2,
      alerts: wAlerts
    };

    return {
      temp: tempDataForNews.temp || 0,
      feelsLike: getAvg(c?.apparent_temperature, wc?.feelslike_c) || 0,
      humidity: getAvg(c?.relative_humidity_2m, wc?.humidity) || 0,
      windSpeed: tempDataForNews.windSpeed || 0,
      windGusts: getMax(c?.wind_gusts_10m, wc?.gust_kph) || 0,
      windDir: c?.wind_direction_10m || wc?.wind_degree || 0,
      pressure: tempDataForNews.pressure || 1013,
      pressureSealevel: Math.round(c?.surface_pressure || wc?.pressure_mb) || 1013,
      description: wc?.condition?.text || getWeatherDesc(c?.weather_code || 0) || "غير معروف",
      weatherCode: c?.weather_code || mapWapiCodeToOm(wc?.condition?.code || 1000),
      cloudCover: tempDataForNews.cloudCover || 0,
      isDay: (c?.is_day === 1) || (wc?.is_day === 1),
      city: cityName,
      country: wapiData?.location?.country || "Global",
      source: (omData && wapiData) ? "Hybrid (OM+WAPI)" : (omData ? "Open-Meteo" : "WeatherAPI"),
      sunrise: formatTime(d?.sunrise?.[0]) || wf?.astro?.sunrise || "--:--",
      sunset: formatTime(d?.sunset?.[0]) || wf?.astro?.sunset || "--:--",
      moonPhase: tempDataForNews.moonPhase,
      dayLength: 12,
      uvIndex: tempDataForNews.uvIndex || 0,
      visibility: (h?.visibility?.[idx] || (wc?.vis_km * 1000)) || 10000,
      dewPoint: getAvg(c?.dew_point_2m, wc?.dewpoint_c || c?.dew_point_2m) || 0,
      airQuality: tempDataForNews.airQuality,
      pollen: 0,
      soilMoisture: h?.soil_moisture_0_to_1cm?.[idx] || 0,
      soilTemp: h?.soil_temperature_0cm?.[idx] || 0,
      evapotranspiration: d?.et0_fao_evapotranspiration?.[0] || 0,
      leafWetness: 0,
      rainProb: tempDataForNews.rainProb || 0,
      rainAmount: getMax(c?.precipitation, wc?.precip_mm),
      snowDepth: c?.snow_depth || 0,
      freezingRain: false,
      cape: 0,
      minutely15: { time: safeSlice15(m15?.time), rain: safeSlice15(m15?.precipitation), temp: safeSlice15(m15?.temperature_2m) },
      hourly: { time: safeSlice(h?.time), temp: safeSlice(h?.temperature_2m), feelsLike: safeSlice(h?.apparent_temperature), pressure: safeSlice(h?.pressure_msl), humidity: safeSlice(h?.relative_humidity_2m), dewPoint: safeSlice(h?.dew_point_2m), uvIndex: safeSlice(h?.uv_index), cloudCover: safeSlice(h?.cloud_cover), visibility: safeSlice(h?.visibility), windSpeed: safeSlice(h?.wind_speed_10m), windDir: safeSlice(h?.wind_direction_10m), windGusts: safeSlice(h?.wind_gusts_10m), rain: safeSlice(h?.precipitation_probability), rainAmount: safeSlice(h?.precipitation), snowDepth: safeSlice(h?.snow_depth), snowFall: safeSlice(h?.snowfall), weatherCode: safeSlice(h?.weather_code), soilMoisture: safeSlice(h?.soil_moisture_0_to_1cm), soilTemp: safeSlice(h?.soil_temperature_0cm) },
      daily: { time: d?.time || [], sunrise: d?.sunrise || [], sunset: d?.sunset || [], uvIndexMax: d?.uv_index_max || [], rainSum: d?.precipitation_sum || [], snowSum: d?.snowfall_sum || [], maxTemp: d?.temperature_2m_max || [], minTemp: d?.temperature_2m_min || [] },
      newsTicker: generateNewsFeed(tempDataForNews)
    };
  } catch (error) {
    console.error("Weather Error:", error);
    // كائن طوارئ (فارغ)
    return {
      temp: 0, feelsLike: 0, humidity: 0, windSpeed: 0, windGusts: 0, windDir: 0, pressure: 0, pressureSealevel: 0,
      description: "غير متاح", weatherCode: 0, cloudCover: 0, isDay: true, city: "غير معروف", country: "-", source: "Error",
      sunrise: "-", sunset: "-", moonPhase: "", dayLength: 0, uvIndex: 0, visibility: 10000, dewPoint: 0, airQuality: 0, pollen: 0,
      soilMoisture: 0, soilTemp: 0, evapotranspiration: 0, leafWetness: 0, rainProb: 0, rainAmount: 0, snowDepth: 0, freezingRain: false, cape: 0,
      minutely15: { time: [], rain: [], temp: [] },
      hourly: { time: [], temp: [], feelsLike: [], pressure: [], humidity: [], dewPoint: [], uvIndex: [], cloudCover: [], visibility: [], windSpeed: [], windDir: [], windGusts: [], rain: [], rainAmount: [], snowDepth: [], snowFall: [], weatherCode: [], soilMoisture: [], soilTemp: [] },
      daily: { time: [], sunrise: [], sunset: [], uvIndexMax: [], rainSum: [], snowSum: [], maxTemp: [], minTemp: [] },
      newsTicker: []
    };
  }
}

// --- دوال الموقع ---
export async function getCityNameFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar&zoom=18`, {headers:{'User-Agent':'App/1.0'}});
    const d = await r.json();
    return d.address?.neighbourhood || d.address?.city || "موقعك";
  } catch { return "موقعك"; }
}

export async function searchCities(query: string): Promise<CityResult[]> {
  try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=ar&format=json`); const d = await r.json(); return d.results || []; } catch { return []; }
}

export async function getLocationByIP(): Promise<{ lat: number, lon: number, city: string } | null> {
  try { const r = await fetch('https://ipapi.co/json/'); const d = await r.json(); return d.latitude ? { lat: d.latitude, lon: d.longitude, city: d.city } : null; } catch { return null; }
}