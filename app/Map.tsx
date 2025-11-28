// app/Map.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. إعدادات الأيقونات ---
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- 2. مكون ذكي لإنعاش الخريطة ---
const MapRefresher = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// --- 3. المكون الرئيسي للخريطة ---
interface MapProps {
  lat: number;
  lon: number;
  city: string;
}

export default function MapComponent({ lat, lon, city }: MapProps) {
  // إدارة حالة الأنيميشن (الرادار المتحرك)
  const [radarFrames, setRadarFrames] = useState<number[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // مفتاح احتياطي
  const OWM_KEY = "e6ca7df7226c2561f77c4f35e7958632";

  // تشغيل محرك البيانات عند البدء
  useEffect(() => {
    const initRadar = async () => {
      try {
        // جلب بيانات الرادار التاريخية (آخر ساعتين) + التوقعات
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();

        if (data.radar && data.radar.past) {
          // نجمع الطوابع الزمنية
          const frames = data.radar.past.map((frame: any) => frame.time);
          if (data.radar.nowcast) {
             // نضيف التوقعات المستقبلية إن وجدت
             frames.push(...data.radar.nowcast.map((frame: any) => frame.time));
          }
          setRadarFrames(frames);
          // نبدأ من آخر صورة متاحة
          setCurrentFrameIndex(frames.length - 1);
        }
      } catch (e) {
        console.error("Radar Engine Error:", e);
      }
    };
    initRadar();
  }, []);

  // تشغيل الأنيميشن (حلقة التكرار)
  useEffect(() => {
    if (radarFrames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
      }, 1000); // تغيير الإطار كل ثانية
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [radarFrames]);

  // الحصول على الوقت الحالي للطبقة
  const activeTimestamp = radarFrames.length > 0 ? radarFrames[currentFrameIndex] : null;

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative z-0 bg-slate-900">
      <MapContainer 
        center={[lat, lon]} 
        zoom={6} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapRefresher />

        <LayersControl position="topright" collapsed={false}>
          
          {/* === خرائط الأساس (Base Maps) === */}
          <LayersControl.BaseLayer checked name="🌍 قمر صناعي (Esri)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🌑 الوضع الداكن (CartoDB)">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="CartoDB"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ خريطة ملونة (OSM)">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>


          {/* === الطبقات الذكية (Smart Overlays) === */}
          
          {/* 1. رادار الأمطار المتحرك (The Crown Jewel) */}
          {activeTimestamp && (
            <LayersControl.Overlay checked name="🌧️ رادار الأمطار (متحرك)">
              <TileLayer
                key={activeTimestamp} // مفتاح لإجبار التحديث
                url={`https://tile.rainviewer.com/img/radar_nowcast_10min/${activeTimestamp}/512/{z}/{x}/{y}/2/1_1.png`}
                opacity={0.8}
              />
            </LayersControl.Overlay>
          )}

          {/* 2. السحب الحرارية (تعمل دائماً) */}
          {activeTimestamp && (
            <LayersControl.Overlay checked name="☁️ السحب والحرارة (Infrared)">
              <TileLayer
                url={`https://tile.rainviewer.com/img/satellite-infrared/${activeTimestamp}/512/{z}/{x}/{y}/0/0_0.png`}
                opacity={0.6}
              />
            </LayersControl.Overlay>
          )}

          {/* 3. طبقات مساعدة */}
          <LayersControl.Overlay name="🌡️ الحرارة (OWM)">
             <TileLayer url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`} opacity={0.5} />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="💨 الرياح (OWM)">
             <TileLayer url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`} opacity={0.6} />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="🧭 الضغط الجوي">
             <TileLayer url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`} opacity={0.5} />
          </LayersControl.Overlay>

        </LayersControl>

        {/* مؤشر الحالة (يظهر وقت الرادار) */}
        {activeTimestamp && (
          <div className="leaflet-bottom leaflet-left m-4 z-[1000]">
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-mono backdrop-blur-md border border-white/20">
              📡 رادار حي: {new Date(activeTimestamp * 1000).toLocaleTimeString('ar-MA')}
            </div>
          </div>
        )}

        <Marker position={[lat, lon]} icon={icon}>
          <Popup>
            <div className="text-center font-bold text-blue-600">{city}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
