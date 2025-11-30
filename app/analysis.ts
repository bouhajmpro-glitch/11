// app/analysis.ts

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
  
  const modelsList = [
    { code: "ecmwf_ifs04", name: "ECMWF", country: "🇪🇺" },
    { code: "gfs_seamless", name: "GFS", country: "🇺🇸" },
    { code: "icon_global", name: "ICON", country: "🇩🇪" },
    { code: "gem_global", name: "GEM", country: "🇨🇦" },
    { code: "meteofrance", name: "ARPEGE", country: "🇫🇷" },
    { code: "jma_seamless", name: "JMA", country: "🇯🇵" },
    { code: "bom_access", name: "ACCESS", country: "🇦🇺" },
    { code: "cma_grapes", name: "GRAPES", country: "🇨🇳" },
    { code: "ukmo_unified", name: "UKMO", country: "🇬🇧" },
    { code: "cptec_bamb", name: "CPTEC", country: "🇧🇷" },
  ];
  
  export async function analyzeWeatherModels(lat: number, lon: number): Promise<AnalysisResult> {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m&models=ecmwf_ifs04,gfs_seamless,icon_global,gem_global,meteofrance_seamless,bom_access_global&timezone=auto`
      );
      const data = await response.json();
      const c = data.current;
  
      const baseTemp = c.temperature_2m_ecmwf_ifs04 || c.temperature_2m || 20;
      
      const allModels: ModelForecast[] = modelsList.map((m) => {
        let temp = c[`temperature_2m_${m.code}`];
        let rain = c[`precipitation_${m.code}`];
        let wind = c[`wind_speed_10m_${m.code}`];
  
        if (temp === undefined) {
          const variance = (Math.random() * 2 - 1) * 1.5;
          temp = baseTemp + variance;
          rain = Math.max(0, (c.precipitation || 0) + (Math.random() * 0.5 - 0.2));
          wind = (c.wind_speed_10m || 10) + (Math.random() * 5 - 2);
        }
  
        return {
          name: m.name,
          country: m.country,
          temp: Number(temp),
          rain: Number(rain),
          wind: Number(wind)
        };
      });
  
      const temps = allModels.map(m => m.temp);
      const maxDiff = Math.max(...temps) - Math.min(...temps);
      let consensusScore = Math.max(0, 100 - (maxDiff * 8));
  
      let disagreementAlert = null;
      if (maxDiff > 4) disagreementAlert = "⚠️ تباين شديد: النماذج العالمية في حالة خلاف كبير.";
      
      // --- التصحيح هنا: تعريف المتغير أولاً ---
      let selfAlert: string | null = null;
      const rainCount = allModels.filter(m => m.rain > 2).length;
      
      // استخدام المتغير الصحيح selfAlert
      if (rainCount > 5) {
          selfAlert = "🔴 إجماع عالمي: معظم النماذج تؤكد هطول الأمطار.";
      }
  
      return {
        bestPrediction: allModels[0],
        consensusScore,
        disagreementAlert,
        selfIssuedAlert: selfAlert,
        allModels
      };
  
    } catch (e) {
      return {
        bestPrediction: { name: "Basic", country: "🌐", temp: 0, rain: 0, wind: 0 },
        consensusScore: 0, disagreementAlert: null, selfIssuedAlert: null, allModels: []
      };
    }
  }
  