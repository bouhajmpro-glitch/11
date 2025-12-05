'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

type Station = {
  lat: number; lon: number;
  temp: number;
  pressure: number;
  windDeg: number;
};

export default function StationPlotLayer({ active }: { active: boolean }) {
  const map = useMap();
  const [stations, setStations] = useState<Station[]>([]);

  // إعادة الحساب عند التحريك
  const updateStations = async () => {
    if (!active) return;
    const zoom = map.getZoom();
    
    // إذا كنت بعيداً جداً، لا تعرض الأرقام لتجنب الفوضى
    if (zoom < 8) {
      setStations([]);
      return;
    }

    const bounds = map.getBounds();
    const center = map.getCenter();
    
    // شبكة ديناميكية: عدد النقاط يقل كلما ابتعدت
    const gridStep = zoom > 12 ? 0.05 : 0.2; 
    
    const points = [];
    // نغطي فقط المنطقة المرئية (Bounds)
    for (let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += gridStep) {
      for (let lon = bounds.getWest(); lon <= bounds.getEast(); lon += gridStep) {
        points.push({ lat, lon });
      }
    }
    
    // نحدد الحد الأقصى للنقاط (مثلاً 20 نقطة في الشاشة) لتجنب الثقل
    const limitedPoints = points.slice(0, 20);

    const requests = limitedPoints.map(async p => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,surface_pressure,wind_direction_10m&timezone=auto`);
        const d = await res.json();
        return {
          lat: p.lat, lon: p.lon,
          temp: Math.round(d.current.temperature_2m),
          pressure: Math.round(d.current.surface_pressure),
          windDeg: d.current.wind_direction_10m
        };
      } catch { return null; }
    });

    const results = await Promise.all(requests);
    setStations(results.filter(s => s !== null) as Station[]);
  };

  useEffect(() => {
    if(active) {
       updateStations();
       map.on('moveend', updateStations);
    } else {
       setStations([]);
    }
    return () => { map.off('moveend', updateStations); };
  }, [map, active]);

  useEffect(() => {
    // رسم الأيقونات الاحترافية (SVG Vector Icons)
    const markers = stations.map(s => {
      const color = s.temp > 30 ? '#ef4444' : (s.temp < 10 ? '#3b82f6' : '#eab308');
      
      const html = `
        <div class="weather-vector-icon" style="position:relative; width:50px; height:50px;">
          <svg viewBox="0 0 24 24" width="50" height="50" style="position:absolute; top:0; left:0; transform: rotate(${s.windDeg}deg); opacity:0.6;">
             <path fill="white" d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
          </svg>
          
          <div style="
            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
            font-family:'Segoe UI', sans-serif; font-weight:900; font-size:14px;
            color:${color}; text-shadow: 0 2px 4px rgba(0,0,0,0.8);
          ">${s.temp}°</div>

          <div style="
             position:absolute; bottom:5px; left:50%; transform:translateX(-50%);
             font-size:9px; color:#cbd5e1; font-family:monospace; background:rgba(0,0,0,0.4); 
             padding:1px 3px; rounded:4px;
          ">${s.pressure}</div>
        </div>
      `;

      const icon = L.divIcon({ className: 'custom-plot', html, iconSize: [50,50], iconAnchor: [25,25] });
      return L.marker([s.lat, s.lon], { icon }).addTo(map);
    });

    return () => {
      markers.forEach(m => map.removeLayer(m));
    };
  }, [stations, map]);

  return null;
}