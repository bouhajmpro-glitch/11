import { WeatherData, CityResult, NewsItem } from './types';
import { generateNewsFeed } from '../analysis/insights';

const WAPI_KEY = '41e414a1fad844269ca185714250412';

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

// --- خوارزمية الوزن الذكي (Weighted Consensus) ---
// تعطي الأولوية للنماذج بناءً على دقتها التاريخية
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

// --- جلب وتحليل 6 نماذج عالمية ---
export async function getModelsData(lat: number, lon: number) {
  // النماذج: ECMWF (أوروبا)، GFS (أمريكا)، ICON (ألمانيا)، GEM (كندا)، BOM (أستراليا)، ARPEGE (فرنسا)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m&models=ecmwf_ifs04,gfs_seamless,icon_global,gem_global,bom_access_global,meteofrance_arpege_world&forecast_days=1`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const idx = new Date().getHours();
    const h = data.hourly;

    // استخراج البيانات لكل نموذج (مع التحقق من وجودها)
    const models = {
      ecmwf: { 
        temp: h.temperature_2m_ecmwf_ifs04 ? h.temperature_2m_ecmwf_ifs04[idx] : 0, 
        rain: h.precipitation_probability_ecmwf_ifs04 ? h.precipitation_probability_ecmwf_ifs04[idx] : 0, 
        wind: h.wind_speed_10m_ecmwf_ifs04 ? h.wind_speed_10m_ecmwf_ifs04[idx] : 0 
      },
      gfs: { 
        temp: h.temperature_2m_gfs_seamless ? h.temperature_2m_gfs_seamless[idx] : 0, 
        rain: h.precipitation_probability_gfs_seamless ? h.precipitation_probability_gfs_seamless[idx] : 0, 
        wind: h.wind_speed_10m_gfs_seamless ? h.wind_speed_10m_gfs_seamless[idx] : 0 
      },
      icon: { 
        temp: h.temperature_2m_icon_global ? h.temperature_2m_icon_global[idx] : 0, 
        rain: h.precipitation_probability_icon_global ? h.precipitation_probability_icon_global[idx] : 0, 
        wind: h.wind_speed_10m_icon_global ? h.wind_speed_10m_icon_global[idx] : 0 
      },
      gem: { 
        temp: h.temperature_2m_gem_global ? h.temperature_2m_gem_global[idx] : 0, 
        rain: h.precipitation_probability_gem_global ? h.precipitation_probability_gem_global[idx] : 0, 
        wind: h.wind_speed_10m_gem_global ? h.wind_speed_10m_gem_global[idx] : 0 
      },
      bom: { 
        temp: h.temperature_2m_bom_access_global ? h.temperature_2m_bom_access_global[idx] : 0, 
        rain: h.precipitation_probability_bom_access_global ? h.precipitation_probability_bom_access_global[idx] : 0, 
        wind: h.wind_speed_10m_bom_access_global ? h.wind_speed_10m_bom_access_global[idx] : 0 
      },
      arpege: { 
        temp: h.temperature_2m_meteofrance_arpege_world ? h.temperature_2m_meteofrance_arpege_world[idx] : 0, 
        rain: h.precipitation_probability_meteofrance_arpege_world ? h.precipitation_probability_meteofrance_arpege_world[idx] : 0, 
        wind: h.wind_speed_10m_meteofrance_arpege_world ? h.wind_speed_10m_meteofrance_arpege_world[idx] : 0 
      },
    };

    // حساب التوقع الهجين (ECMWF هو الملك بوزن 0.35)
    const hybridTemp = calculateWeightedAvg([
      { val: models.ecmwf.temp, weight: 0.35 },
      { val: models.gfs.temp, weight: 0.20 },
      { val: models.icon.temp, weight: 0.15 },
      { val: models.arpege.temp, weight: 0.15 },
      { val: models.gem.temp, weight: 0.10 },
      { val: models.bom.temp, weight: 0.05 },
    ]);

    // حساب نسبة الثقة (Consensus Score)
    const temps = Object.values(models).map((m: any) => m.temp);
    const deviation = Math.sqrt(temps.reduce((sum, val) => sum + Math.pow(val - hybridTemp, 2), 0) / temps.length);
    // إذا كان الانحراف 0 (تطابق تام) الثقة 100%، كل درجة انحراف تخصم 15%
    const confidenceScore = Math.max(Math.min(Math.round(100 - (deviation * 15)), 100), 30);

    return {
      score: confidenceScore,
      hybridTemp,
      ...models
    };
  } catch (e) {
    console.error("Models Fetch Error", e);
    return null;
  }
}

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
  const sliceData = (arr: any[]) => arr ? arr.slice(idx, idx + 24) : Array(24).fill(0);
  
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const index15 = Math.floor(minutesSinceMidnight / 15);
  const slice15 = (arr: any[]) => arr ? arr.slice(index15, index15 + 12) : Array(12).fill(0);

  const getAvg = (v1: number, v2: number) => (v1 && v2) ? Math.round((v1 + v2) / 2) : (v1 || v2);
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
    temp: tempDataForNews.temp,
    feelsLike: getAvg(c?.apparent_temperature, wc?.feelslike_c),
    humidity: getAvg(c?.relative_humidity_2m, wc?.humidity),
    windSpeed: tempDataForNews.windSpeed,
    windGusts: getMax(c?.wind_gusts_10m, wc?.gust_kph),
    windDir: c?.wind_direction_10m || wc?.wind_degree,
    pressure: tempDataForNews.pressure,
    pressureSealevel: Math.round(c?.surface_pressure || wc?.pressure_mb),
    description: wc?.condition?.text || getWeatherDesc(c?.weather_code || 0),
    weatherCode: c?.weather_code || mapWapiCodeToOm(wc?.condition?.code || 1000),
    cloudCover: tempDataForNews.cloudCover,
    isDay: (c?.is_day === 1) || (wc?.is_day === 1),
    city: cityName,
    country: wapiData?.location?.country || "Global",
    source: (omData && wapiData) ? "Hybrid (OM+WAPI)" : (omData ? "Open-Meteo" : "WeatherAPI"),
    
    sunrise: formatTime(d?.sunrise?.[0]) || wf?.astro?.sunrise,
    sunset: formatTime(d?.sunset?.[0]) || wf?.astro?.sunset,
    moonPhase: tempDataForNews.moonPhase,
    dayLength: 12,

    uvIndex: tempDataForNews.uvIndex,
    visibility: (h?.visibility?.[idx] || (wc?.vis_km * 1000)) || 10000,
    dewPoint: getAvg(c?.dew_point_2m, wc?.dewpoint_c || c?.dew_point_2m),
    airQuality: tempDataForNews.airQuality,
    pollen: 0,

    soilMoisture: h?.soil_moisture_0_to_1cm?.[idx] || 0,
    soilTemp: h?.soil_temperature_0cm?.[idx] || 0,
    evapotranspiration: d?.et0_fao_evapotranspiration?.[0] || 0,
    leafWetness: 0,

    rainProb: tempDataForNews.rainProb,
    rainAmount: getMax(c?.precipitation, wc?.precip_mm),
    snowDepth: c?.snow_depth || 0,
    freezingRain: false,
    cape: 0,

    minutely15: {
        time: slice15(m15?.time),
        rain: slice15(m15?.precipitation),
        temp: slice15(m15?.temperature_2m)
    },

    hourly: {
      time: sliceData(h?.time),
      temp: sliceData(h?.temperature_2m),
      feelsLike: sliceData(h?.apparent_temperature),
      pressure: sliceData(h?.pressure_msl),
      humidity: sliceData(h?.relative_humidity_2m),
      dewPoint: sliceData(h?.dew_point_2m),
      uvIndex: sliceData(h?.uv_index),
      cloudCover: sliceData(h?.cloud_cover),
      visibility: sliceData(h?.visibility),
      windSpeed: sliceData(h?.wind_speed_10m), 
      windDir: sliceData(h?.wind_direction_10m),
      windGusts: sliceData(h?.wind_gusts_10m),
      rain: sliceData(h?.precipitation_probability),
      rainAmount: sliceData(h?.precipitation),
      snowDepth: sliceData(h?.snow_depth),
      snowFall: sliceData(h?.snowfall),
      weatherCode: sliceData(h?.weather_code),
      soilMoisture: sliceData(h?.soil_moisture_0_to_1cm),
      soilTemp: sliceData(h?.soil_temperature_0cm)
    },
    daily: {
      time: d?.time || [],
      sunrise: d?.sunrise || [],
      sunset: d?.sunset || [],
      uvIndexMax: d?.uv_index_max || [],
      rainSum: d?.precipitation_sum || [],
      snowSum: d?.snowfall_sum || [],
      maxTemp: d?.temperature_2m_max || [],
      minTemp: d?.temperature_2m_min || []
    },

    newsTicker: generateNewsFeed(tempDataForNews)
  };
}

// --- دالة الموقع الدقيق (High-Precision Geolocation) ---
export async function getCityNameFromCoords(lat: number, lon: number): Promise<string> {
  try {
    // نستخدم زووم 18 للحصول على أدق تفاصيل ممكنة (الحي، الشارع)
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar&zoom=18`, {headers:{'User-Agent':'App/1.0'}});
    const d = await r.json();
    
    const addr = d.address;
    
    // الأولوية القصوى للحي أو الدوار
    if (addr) {
      return addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.hamlet || addr.village || addr.city || addr.town || "موقع محدد";
    }
    return "موقع محدد";
  } catch {
    return "موقعك";
  }
}

export async function searchCities(query: string): Promise<CityResult[]> {
  try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=ar&format=json`); const d = await r.json(); return d.results || []; } catch { return []; }
}

export async function getLocationByIP(): Promise<{ lat: number, lon: number, city: string } | null> {
  try { const r = await fetch('https://ipapi.co/json/'); const d = await r.json(); return d.latitude ? { lat: d.latitude, lon: d.longitude, city: d.city } : null; } catch { return null; }
}