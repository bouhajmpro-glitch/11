'use client';

import { useEffect, useState } from 'react';
import { useMap, CircleMarker, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Flame, Activity } from 'lucide-react';

// --- التغيير هنا: قمنا بتغيير المسار من lab إلى hazards ---
import { fetchQuakes, fetchWildfires, type HazardPoint } from '../core/hazards/hazardService';

const fireIcon = L.divIcon({
  html: `<div style="color:orange; font-size:20px;">🔥</div>`,
  className: 'custom-div-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

interface Props {
  showQuakes: boolean;
  showFires: boolean;
}

export default function HazardLayers({ showQuakes, showFires }: Props) {
  const [quakes, setQuakes] = useState<HazardPoint[]>([]);
  const [fires, setFires] = useState<HazardPoint[]>([]);

  useEffect(() => {
    const loadHazards = async () => {
      const qData = await fetchQuakes();
      setQuakes(qData);
      
      const fData = await fetchWildfires();
      setFires(fData);
    };
    loadHazards();
  }, []);

  return (
    <>
      {showQuakes && quakes.map(q => (
        <CircleMarker 
          key={q.id}
          center={[q.lat, q.lon]}
          radius={(q.magnitude || 1) * 4}
          pathOptions={{ color: 'red', fillColor: '#f00', fillOpacity: 0.3, weight: 1 }}
        >
          <Popup>
            <div className="text-right" dir="rtl">
              <h4 className="font-bold text-red-600 flex items-center gap-1">
                <Activity size={14}/> زلزال بقوة {q.magnitude}
              </h4>
              <p className="text-xs text-slate-600">{q.title}</p>
              <p className="text-[10px] text-slate-400">{q.date}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {showFires && fires.map(f => (
        <Marker key={f.id} position={[f.lat, f.lon]} icon={fireIcon}>
          <Popup>
            <div className="text-right" dir="rtl">
              <h4 className="font-bold text-orange-600 flex items-center gap-1">
                <Flame size={14}/> حريق (NASA)
              </h4>
              <p className="text-xs text-slate-600">{f.title}</p>
              <p className="text-[10px] text-slate-400">{f.date}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}