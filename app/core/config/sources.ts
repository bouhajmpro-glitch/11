// app/core/config/sources.ts

export interface DataSource {
    id: string;
    name: string;
    type: 'weather' | 'marine' | 'air' | 'space' | 'seismic' | 'news';
    url: string;
    params: Record<string, string>;
    updateInterval: number; // بالدقائق
  }
  
  export const DATA_SOURCES: DataSource[] = [
    {
      id: 'open-meteo-main',
      name: 'الطقس العالمي',
      type: 'weather',
      url: 'https://api.open-meteo.com/v1/forecast',
      params: {
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m',
        hourly: 'temperature_2m,precipitation_probability,weather_code,visibility,uv_index',
        daily: 'sunrise,sunset,uv_index_max',
        timezone: 'auto'
      },
      updateInterval: 15
    },
    {
      id: 'open-meteo-marine',
      name: 'علوم البحار',
      type: 'marine',
      url: 'https://marine-api.open-meteo.com/v1/marine',
      params: {
        current: 'wave_height,wave_direction,wave_period',
        hourly: 'wave_height',
        timezone: 'auto'
      },
      updateInterval: 60
    },
    {
      id: 'open-meteo-air',
      name: 'جودة الهواء',
      type: 'air',
      url: 'https://air-quality-api.open-meteo.com/v1/air-quality',
      params: {
        current: 'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,dust',
        timezone: 'auto'
      },
      updateInterval: 30
    },
    {
      id: 'usgs-earthquakes',
      name: 'مركز الزلازل الأمريكي',
      type: 'seismic',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      params: {},
      updateInterval: 5
    },
    {
      id: 'nasa-neo',
      name: 'كويكبات ناسا',
      type: 'space',
      url: 'https://api.nasa.gov/neo/rest/v1/feed',
      params: {
        api_key: 'DEMO_KEY' // سنستبدله لاحقاً
      },
      updateInterval: 1440 // يومي
    }
  ];
  