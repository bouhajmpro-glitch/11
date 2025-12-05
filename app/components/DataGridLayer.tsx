'use client';

import { useEffect, useState } from 'react';
import { useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

// نوع البيانات التي سنرسمها
type GridPoint = {
  lat: number;
  lon: number;
  temp: number;
  pressure: number;
};

export default function DataGridLayer({ active }: { active: boolean }) {
  const map = useMap();
  const [points, setPoints] = useState<GridPoint[]>([]);

  useEffect(() => {
    if (!active) return;

    // دالة لتوليد شبكة نقاط حول مركز الخريطة
    const fetchGridData = async () => {
      const center = map.getCenter();
      // ننشئ 9 نقاط (3x3) حول المركز لتحليل المنطقة
      // المسافة بين النقاط تزداد كلما قل الزووم
      const spread = 0.05; // حوالي 5 كم
      
      const gridCoords = [];
      for(let latOff = -1; latOff <= 1; latOff++) {
        for(let lonOff = -1; lonOff <= 1; lonOff++) {
          gridCoords.push({
            lat: center.lat + (latOff * spread),
            lon: center.lng + (lonOff * spread)
          });
        }
      }

      // جلب البيانات لكل نقطة (يمكن تحسينها بطلب واحد كبير لاحقاً)
      const requests = gridCoords.map(async (coord) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&current_weather=true&hourly=pressure_msl`);
          const data = await res.json();
          return {
            lat: coord.lat,
            lon: coord.lon,
            temp: data.current_weather.temperature,
            pressure: data.hourly?.pressure_msl ? data.hourly.pressure_msl[0] : 1013
          };
        } catch (e) { return null; }
      });

      const results = await Promise.all(requests);
      setPoints(results.filter(p => p !== null) as GridPoint[]);
    };

    fetchGridData();
    
    // تحديث البيانات عند تحريك الخريطة
    map.on('moveend', fetchGridData);
    return () => { map.off('moveend', fetchGridData); };
  }, [map, active]);

  if (!active) return null;

  return (
    <>
      {points.map((p, idx) => {
        // إنشاء أيقونة مخصصة تعرض الأرقام (HTML Icon)
        const customIcon = L.divIcon({
          className: 'weather-data-label',
          html: `
            <div style="
              background: rgba(255,255,255,0.8); 
              padding: 4px; 
              border-radius: 6px; 
              border: 1px solid #ccc;
              text-align: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              font-family: sans-serif;
            ">
              <div style="font-weight:bold; color:#d9534f; font-size:12px;">${p.temp}°</div>
              <div style="font-size:9px; color:#333;">${p.pressure} hPa</div>
            </div>
          `,
          iconSize: [50, 40],
          iconAnchor: [25, 20]
        });

        return <Marker key={idx} position={[p.lat, p.lon]} icon={customIcon} />;
      })}
    </>
  );
}