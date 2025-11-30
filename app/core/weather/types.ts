export interface HourlyData {
  time: string[];
  temp: number[];
  weatherCode: number[];
  rain: number[];
  wind: number[];
  uvIndex: number[];
  soilMoisture: number[];
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  pressure: number;
  description: string;
  weatherCode: number;
  isDay: boolean;
  city: string;
  sunrise: string;
  sunset: string;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  dewPoint: number;
  moonPhase: string;
  rainProb: number;
  soilMoisture: number;
  evapotranspiration: number;
  hourly: HourlyData;
}

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}
