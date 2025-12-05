"use client";

import { useEffect, useState } from "react";
import { 
  MapContainer, 
  TileLayer, 
  LayersControl, 
  useMap, 
  useMapEvents 
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- 1. إصلاح أيقونات Leaflet ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { BaseLayer, Overlay } = LayersControl;

// --- 2. تعريف واجهة البيانات الاحترافية ---
interface WeatherTelemetry {
  lat: number;
  lng: number;
  temp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDir: number;
  elevation: number;
  visibility: number;
  dewPoint: number;
}

// --- 3. مكون "متحكم الخريطة" (العقل المدبر) ---
// وظيفته: مراقبة حركة الخريطة وجلب البيانات للمركز (Crosshair)
function MapController({ onMoveEnd }: { onMoveEnd: (lat: number, lng: number) => void }) {
  const map = useMap();

  // عند التحميل الأول، نحدد موقع المستخدم
  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      map.flyTo(e.latlng, 10, { duration: 1.5 });
    });
  }, [map]);

  // عند توقف الحركة، نرسل الإحداثيات الجديدة
  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });

  return null;
}

// --- 4. المكون الرئيسي الشامل ---
export default function WeatherMap() {
  const [radarTime, setRadarTime] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState<WeatherTelemetry | null>(null);
  const [loading, setLoading] = useState(false);

  // مفتاح API لطبقات OWM (للعرض البصري)
  const API_KEY = "3dce5b706c4961502444265691077755"; 

  // جلب وقت الرادار
  useEffect(() => {
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((res) => res.json())
      .then((d) => {
        if (d.radar?.past?.length) setRadarTime(d.radar.past[d.radar.past.length - 1].time);
      });
  }, []);

  // دالة جلب البيانات عند توقف الخريطة (مركز الشاشة)
  const handleMapMove = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // نطلب بيانات شاملة من Open-Meteo
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,visibility,dew_point_2m&elevation=true`
      );
      const data = await res.json();

      if (data.current) {
        setTelemetry({
          lat: data.latitude,
          lng: data.longitude,
          elevation: data.elevation || 0,
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          pressure: data.current.surface_pressure,
          windSpeed: data.current.wind_speed_10m,
          windDir: data.current.wind_direction_10m,
          visibility: data.current.visibility || 10000,
          dewPoint: data.current.dew_point_2m
        });
      }
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full bg-slate-900 text-white overflow-hidden relative">
      
      {/* ================= A. لوحة القيادة الجانبية (Dashboard) ================= */}
      <aside className="w-72 bg-slate-900 border-r border-slate-700 flex flex-col z-20 shadow-2xl shrink-0 overflow-y-auto hidden md:flex">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Live Telemetry</h2>
          <div className="font-mono text-[10px] text-gray-400">
             {telemetry ? `${telemetry.lat.toFixed(4)}, ${telemetry.lng.toFixed(4)}` : "ACQUIRING GPS..."}
          </div>
        </div>

        <div className="p-4 space-y-6 flex-grow">
          {telemetry ? (
            <>
              {/* الحرارة */}
              <div className="text-center">
                <div className="text-5xl font-black text-white">{Math.round(telemetry.temp)}°</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Temperature</div>
              </div>

              {/* الشبكة */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <div className="text-[9px] text-gray-500 uppercase">Wind</div>
                    <div className="text-sm font-bold">{telemetry.windSpeed} km/h</div>
                 </div>
                 <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <div className="text-[9px] text-gray-500 uppercase">Pressure</div>
                    <div className="text-sm font-bold">{telemetry.pressure} hPa</div>
                 </div>
                 <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <div className="text-[9px] text-gray-500 uppercase">Humidity</div>
                    <div className="text-sm font-bold text-cyan-400">{telemetry.humidity}%</div>
                 </div>
                 <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <div className="text-[9px] text-gray-500 uppercase">Dew Point</div>
                    <div className="text-sm font-bold">{telemetry.dewPoint}°</div>
                 </div>
              </div>
              
              {/* الارتفاع والرؤية */}
              <div className="space-y-2 text-xs font-mono text-gray-300">
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                      <span>ELEVATION:</span> <span>{telemetry.elevation}m</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                      <span>VISIBILITY:</span> <span>{(telemetry.visibility/1000).toFixed(1)}km</span>
                  </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600 text-xs">
               Waiting for data...
            </div>
          )}
        </div>
      </aside>

      {/* ================= B. منطقة الخريطة (Map Area) ================= */}
      <div className="flex-grow relative h-full">
        
        {/* مؤشر التصويب (Crosshair) - دائماً في الوسط */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
            <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center transition-colors ${loading ? 'border-yellow-500 animate-pulse' : 'border-red-500 shadow-[0_0_10px_red]'}`}>
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            </div>
            {/* خطوط التصويب */}
            <div className="absolute top-1/2 left-[-20px] w-[20px] h-[1px] bg-red-500/50"></div>
            <div className="absolute top-1/2 right-[-20px] w-[20px] h-[1px] bg-red-500/50"></div>
            <div className="absolute left-1/2 top-[-20px] h-[20px] w-[1px] bg-red-500/50"></div>
            <div className="absolute left-1/2 bottom-[-20px] h-[20px] w-[1px] bg-red-500/50"></div>
        </div>

        {/* الخريطة والطبقات */}
        <MapContainer
          center={[31.7917, -7.0926]}
          zoom={5}
          className="w-full h-full bg-[#111]"
          zoomControl={false} // سنعتمد على التكبير باللمس أو العجلة للحفاظ على نظافة الواجهة
        >
          <MapController onMoveEnd={handleMapMove} />

          {/* === هنا توجد الطبقات التي افتقدتها (LayersControl) === */}
          <LayersControl position="topright" collapsed={false}>
            
            {/* 1. الخرائط الأساسية (Base Maps) */}
            <BaseLayer checked name="🛰️ قمر صناعي (Satellite)">
              <TileLayer
                attribution="Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </BaseLayer>

            <BaseLayer name="🗺️ خريطة عادية (Standard)">
              <TileLayer
                attribution="OSM"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </BaseLayer>

            <BaseLayer name="🌑 خريطة ليلية (Dark Mode)">
               <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            </BaseLayer>

            <BaseLayer name="🏔️ تضاريس (Terrain)">
                <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
            </BaseLayer>

            {/* 2. طبقات البيانات (Overlays) */}
            
            <Overlay checked name="🏷️ أسماء المدن (Labels)">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
            </Overlay>

            {radarTime && (
                <Overlay checked name="🌧️ رادار الأمطار (Radar)">
                    <TileLayer
                        url={`https://tilecache.rainviewer.com/v2/radar/${radarTime}/512/{z}/{x}/{y}/2/1_1.png`}
                        opacity={0.7}
                    />
                </Overlay>
            )}

            <Overlay name="☁️ السحب (Clouds)">
                <TileLayer url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`} opacity={0.6} />
            </Overlay>

            <Overlay name="💨 سرعة الرياح (Wind)">
                <TileLayer url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`} opacity={0.6} />
            </Overlay>

            <Overlay name="🌡️ ضغط جوي (Pressure)">
                <TileLayer url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`} opacity={0.5} />
            </Overlay>

          </LayersControl>
        </MapContainer>

        {/* لوحة تحكم صغيرة للموبايل (تظهر فقط في الشاشات الصغيرة) */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 p-2 md:hidden z-[900] text-white flex justify-between items-center text-xs">
             <div>
                 <span className="block text-gray-400">Temp</span>
                 <span className="font-bold text-lg">{telemetry ? Math.round(telemetry.temp) : '--'}°</span>
             </div>
             <div>
                 <span className="block text-gray-400">Wind</span>
                 <span className="font-bold text-lg">{telemetry ? telemetry.windSpeed : '--'}</span>
             </div>
             <div>
                 <span className="block text-gray-400">Hum</span>
                 <span className="font-bold text-lg">{telemetry ? telemetry.humidity : '--'}%</span>
             </div>
        </div>

      </div>
    </div>
  );
}