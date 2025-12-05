'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RadarFrame } from '../core/weather/radarService';

interface Props {
  frames: RadarFrame[];
  currentIndex: number;
}

export default function RainRadarLayer({ frames, currentIndex }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!frames || frames.length === 0 || !frames[currentIndex]) return;
    
    // تنظيف الطبقات القديمة
    const cleanUp = () => {
        map.eachLayer(l => { 
            if ((l as any)._isWeatherLayer) map.removeLayer(l); 
        });
    };
    cleanUp();

    const frame = frames[currentIndex];
    const tileUrl = `https://tile.cache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    // 1. طبقة الرادار (الأمطار المتحركة)
    const radarLayer = L.tileLayer(tileUrl, {
      opacity: 0.8,
      zIndex: 10,
      attribution: 'RainViewer Radar'
    });

    // 2. طبقة السحب (المهمة جداً لرؤية حركة السحب قبل المطر)
    const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=b1b15e88fa797225412429c1c50c122a1`, {
      opacity: 0.3,
      zIndex: 9,
      attribution: 'OWM Clouds'
    });

    (radarLayer as any)._isWeatherLayer = true;
    (cloudsLayer as any)._isWeatherLayer = true;
    
    cloudsLayer.addTo(map);
    radarLayer.addTo(map);

    return () => cleanUp();
  }, [map, frames, currentIndex]);

  return null;
}