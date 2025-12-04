// app/core/weather/types.ts

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
  windSpeed: number[]; // Assure-toi que c'est windSpeed ici
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

export interface WeatherData {
  // --- Basic ---
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  pressureSealevel: number;
  windSpeed: number;
  windGusts: number;
  windDir: number;
  description: string;
  weatherCode: number;
  cloudCover: number; // <--- AJOUTÉ ICI (C'était le manquant)
  isDay: boolean;
  city: string;
  country: string;
  
  // --- Astronomy ---
  sunrise: string;
  sunset: string;
  moonPhase: string;
  dayLength: number;

  // --- Bio ---
  uvIndex: number;
  visibility: number;
  dewPoint: number;
  airQuality: number;
  pollen: number;
  
  // --- Agro ---
  soilMoisture: number;
  soilTemp: number;
  evapotranspiration: number;
  leafWetness: number;

  // --- Hazards ---
  rainProb: number;
  rainAmount: number;
  snowDepth: number;
  freezingRain: boolean;
  cape: number;

  // --- Arrays ---
  hourly: HourlyData;
  daily: DailyData;
}

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  timezone: string;
}