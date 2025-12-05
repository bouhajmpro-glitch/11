export interface RadarFrame {
    time: number;
    path: string;
    isForecast: boolean;
  }
  
  export const fetchRadarFrames = async (): Promise<RadarFrame[]> => {
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();
      
      let frames: RadarFrame[] = [];
  
      if (data.radar && data.radar.past) {
        frames = frames.concat(data.radar.past.map((item: any) => ({
          time: item.time,
          path: item.path,
          isForecast: false
        })));
      }
  
      if (data.radar && data.radar.nowcast) {
        frames = frames.concat(data.radar.nowcast.map((item: any) => ({
          time: item.time,
          path: item.path,
          isForecast: true
        })));
      }
  
      return frames.sort((a, b) => a.time - b.time);
    } catch (error) {
      console.error("Radar Error:", error);
      return [];
    }
  };