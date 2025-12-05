'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function WindLayer() {
  const map = useMap();

  useEffect(() => {
    // API KEY تجريبي، يجب استبداله بمفتاحك الخاص أو استخدام تقنية Velocity
    const APPID = 'b1b15e88fa797225412429c1c50c122a1'; 

    // طبقات الحركة
    const windSpeedLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${APPID}`, {
      opacity: 0.6,
      zIndex: 5, // طبقة متوسطة
      attribution: 'Wind Flow'
    });
    
    // طبقة الضغط الجوي (لتحقيق خطوط التساوي)
    const pressureLayer = L.tileLayer(`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${APPID}`, {
      opacity: 0.5,
      zIndex: 6, // فوق الرياح
      attribution: 'Pressure'
    });
    
    // طبقة الحرارة (Heatmap)
    const tempLayer = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${APPID}`, {
      opacity: 0.4,
      zIndex: 4, // أسفل الرياح
      attribution: 'Temperature'
    });

    // إضافة الطبقات للعمل
    map.addLayer(windSpeedLayer);
    map.addLayer(pressureLayer);
    map.addLayer(tempLayer);

    return () => {
      map.removeLayer(windSpeedLayer);
      map.removeLayer(pressureLayer);
      map.removeLayer(tempLayer);
    };
  }, [map]);

  return null;
}