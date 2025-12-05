'use client';

import { useEffect } from 'react';

interface WindLayerProps {
  map: any;
  active: boolean;
}

export default function WindLayer({ map, active }: WindLayerProps) {
  useEffect(() => {
    if (!map || typeof window === 'undefined') return;

    // تنظيف الطبقات القديمة لمنع التكرار
    const cleanUp = () => {
      map.eachLayer((layer: any) => {
        if (layer._isWindLayer) {
          map.removeLayer(layer);
        }
      });
    };

    if (!active) {
      cleanUp();
      return;
    }

    const L = (window as any).L;
    
    // نتحقق أن مكتبة الرياح تم تحميلها في الصفحة الرئيسية
    if (!L || !L.velocityLayer) {
      console.warn("WindLayer: Leaflet or Velocity not loaded yet.");
      return;
    }

    // جلب بيانات الرياح التجريبية
    fetch('https://raw.githubusercontent.com/onaci/leaflet-velocity/master/demo/wind-global.json')
      .then((res) => res.json())
      .then((data) => {
        cleanUp(); // تنظيف قبل الرسم

        const velocityLayer = L.velocityLayer({
          displayValues: true,
          displayOptions: {
            velocityType: 'Global Wind',
            position: 'bottomleft',
            emptyString: 'No wind data',
            angleConvention: 'bearingCW',
            displayEmptyString: 'No wind data',
            speedUnit: 'km/h'
          },
          data: data,
          maxVelocity: 15,
          velocityScale: 0.005 
        });

        // علامة لتمييز الطبقة وحذفها لاحقاً
        (velocityLayer as any)._isWindLayer = true;
        
        velocityLayer.addTo(map);
      })
      .catch(err => console.error("Wind Data Error:", err));

    return () => cleanUp();
  }, [map, active]);

  return null;
}