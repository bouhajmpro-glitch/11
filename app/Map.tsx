// app/Map.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// مكون إصلاح الحجم والمقياس
const MapController = ({ setZoom }: { setZoom: (z: number) => void }) => {
  const map = useMap();
  
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()), // تحديث الزوم عند التغيير
  });

  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 500);
  }, [map]);

  return null;
};

// طبقة الحرارة الذكية (تتغير مع الزوم)
const SmartHeatmap = ({ lat, lon, zoom }: { lat: number, lon: number, zoom: number }) => {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/leaflet.heat/dist/leaflet-heat.js";
    script.onload = () => {
      if (layerRef.current) map.removeLayer(layerRef.current);

      const points = [];
      // توليد سحابة حرارية أوسع وأدق
      for (let i = 0; i < 200; i++) {
        points.push([
          lat + (Math.random() - 0.5) * 5, // مساحة 5 درجات
          lon + (Math.random() - 0.5) * 5,
          Math.random() * 30
        ]);
      }

      // الحيلة: تغيير نصف القطر (radius) عكسياً مع الزوم
      // زوم كبير (قريب) -> نصف قطر كبير
      // زوم صغير (بعيد) -> نصف قطر صغير
      const radius = Math.max(10, zoom * 3);

      // @ts-ignore
      if (L.heatLayer) {
        // @ts-ignore
        layerRef.current = L.heatLayer(points, { radius, blur: 20, maxZoom: 10 }).addTo(map);
      }
    };
    document.body.appendChild(script);
  }, [map, lat, lon, zoom]);

  return null;
};

export default function MapComponent({ lat, lon, city }: { lat: number, lon: number, city: string }) {
  const [radarFrames, setRadarFrames] = useState<number[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [zoom, setZoom] = useState(6); // الزوم الحالي
  const [isPlaying, setIsPlaying] = useState(false);

  // جلب إطارات الرادار (الماضي)
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data.radar?.past) {
          const past = data.radar.past.map((f: any) => f.time);
          const now = data.radar.nowcast.map((f: any) => f.time);
          setRadarFrames([...past, ...now]); // دمج الماضي والمستقبل
          setFrameIndex(past.length - 1); // البدء من "الآن"
        }
      });
  }, []);

  // محرك الفيديو (Animation Loop)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && radarFrames.length > 0) {
      interval = setInterval(() => {
        setFrameIndex(prev => (prev + 1) % radarFrames.length);
      }, 500); // سرعة الحركة
    }
    return () => clearInterval(interval);
  }, [isPlaying, radarFrames]);

  const currentTs = radarFrames[frameIndex];

  return (
    <div className="h-full w-full bg-slate-900 relative z-0 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex-1 relative">
        <MapContainer center={[lat, lon]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <MapController setZoom={setZoom} />
          
          {/* الطبقة الحرارية المتجاوبة */}
          <SmartHeatmap lat={lat} lon={lon} zoom={zoom} />

          <LayersControl position="topright" collapsed={false}>
            <LayersControl.BaseLayer checked name="🌍 قمر صناعي">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🗺️ خريطة">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            </LayersControl.BaseLayer>

            {currentTs && (
              <LayersControl.Overlay checked name="🌧️ رادار متحرك">
                <TileLayer url={`https://tile.rainviewer.com/img/radar_nowcast_10min/${currentTs}/512/{z}/{x}/{y}/2/1_1.png`} opacity={0.8} />
              </LayersControl.Overlay>
            )}
          </LayersControl>
          <Marker position={[lat, lon]} icon={icon}><Popup><b>{city}</b></Popup></Marker>
        </MapContainer>
      </div>

      {/* شريط التحكم بالزمن (Timeline) */}
      <div className="h-16 bg-slate-800 border-t border-white/10 p-2 flex items-center gap-4 px-4">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-4 py-2 rounded-full font-bold text-xs ${isPlaying ? 'bg-red-500' : 'bg-green-500'} text-white`}
        >
          {isPlaying ? "إيقاف" : "تشغيل"}
        </button>
        
        <div className="flex-1">
          <input 
            type="range" 
            min="0" 
            max={radarFrames.length - 1} 
            value={frameIndex} 
            onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>-2 ساعة</span>
            <span className="text-white font-bold">الآن</span>
            <span>+30 دقيقة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
