// app/core/analysis/engine.ts

export interface ModelForecast {
    name: string;
    country: string;
    temp: number;
    rain: number;
    wind: number;
  }
  
  export interface AnalysisResult {
    bestPrediction: ModelForecast;
    consensusScore: number;
    disagreementAlert: string | null;
    selfIssuedAlert: string | null;
    allModels: ModelForecast[];
  }
  
  export async function analyzeWeatherModels(lat: number, lon: number): Promise<AnalysisResult> {
    try {
      // محاكاة ذكية للبيانات (أو استبدلها بـ fetch حقيقي لاحقاً)
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m&timezone=auto`);
      const data = await res.json();
      
      const baseTemp = data.current.temperature_2m;
      
      const allModels = [
        { name: "ECMWF", country: "🇪🇺", temp: baseTemp, rain: 0, wind: 10 },
        { name: "GFS", country: "🇺🇸", temp: baseTemp + 0.5, rain: 0, wind: 12 },
        { name: "ICON", country: "🇩🇪", temp: baseTemp - 0.2, rain: 0, wind: 9 },
      ];
  
      return {
        bestPrediction: allModels[0],
        consensusScore: 92,
        disagreementAlert: null,
        selfIssuedAlert: null,
        allModels
      };
    } catch (e) {
      return { bestPrediction: { name: "-", country: "-", temp: 0, rain: 0, wind: 0 }, consensusScore: 0, disagreementAlert: null, selfIssuedAlert: null, allModels: [] };
    }
  }
  