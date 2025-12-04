export interface MinutelyData {
  time: string[];
  rain: number[];
  temp: number[];
}

export interface HourlyData {
  time: string[];
  temp: number[];
  feelsLike: number[];
  pressure: number[];
  humidity: number[];
  dewPoint: number[];
  uvIndex: number[];
  cloudCover: number[];
  visibility: number[];
  windSpeed: number[];
  windDir: number[];
  windGusts: number[];
  rain: number[];
  rainAmount: number[];
  snowDepth: number[];
  snowFall: number[];
  weatherCode: number[];
  soilMoisture: number[];
  soilTemp: number[];
}

export interface DailyData {
  time: string[];
  sunrise: string[];
  sunset: string[];
  uvIndexMax: number[];
  rainSum: number[];
  snowSum: number[];
  maxTemp: number[];
  minTemp: number[];
}

export interface LifestyleData {
  [key: string]: string;
}

// تحديث هيكل الخبر لدعم الروابط والتفاصيل
export interface NewsItem {
  type: 'danger' | 'info' | 'space' | 'science' | 'crawler';
  text: string;
  source?: string;
  link?: string;    // رابط خارجي (اختياري)
  details?: string; // تفاصيل إضافية للقراءة (اختياري)
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  windDir: number;
  pressure: number;
  pressureSealevel: number;
  description: string;
  weatherCode: number;
  cloudCover: number;
  isDay: boolean;
  city: string;
  country: string;
  source: string;

  sunrise: string;
  sunset: string;
  moonPhase: string;
  dayLength: number;

  uvIndex: number;
  visibility: number;
  dewPoint: number;
  airQuality: number;
  pollen: number;

  soilMoisture: number;
  soilTemp: number;
  evapotranspiration: number;
  leafWetness: number;

  rainProb: number;
  rainAmount: number;
  snowDepth: number;
  freezingRain: boolean;
  cape: number;

  minutely15: MinutelyData;
  hourly: HourlyData;
  daily: DailyData;
  lifestyle?: LifestyleData;
  
  newsTicker: NewsItem[];
}

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}