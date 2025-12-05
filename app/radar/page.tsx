'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { 
  Play, Pause, CloudRain, Wind, Thermometer, Cloud, Gauge, Layers, Search, Table2 
} from 'lucide-react';

import { getWeather, fetchUnifiedTimeline, fetchWeatherGrid, GridDataPoint } from '../core/weather/api';

import RadarPanel from '../components/RadarPanel'; 
import ModelComparison from '../components/ModelComparison';
import WindLayer from '../components/WindLayer';
import TileAnimator from '../components/TileAnimator';
import HeatmapLayer from '../components/HeatmapLayer';

export default function RadarPage() {
  const mapRef = useRef<any>(null);
  const [status, setStatus] = useState('جاري تحميل الخريطة...');
  const [isMapReady, setIsMapReady] = useState(false);
  
  // حالة المكتبات
  const [libState, setLibState] = useState({ leaflet: false, velocity: false });

  // الطبقات
  const [activeLayer, setActiveLayer] = useState<'radar' | 'satellite' | 'wind' | 'temp' | 'clouds' | 'pressure'>('radar');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gridData, setGridData] = useState<GridDataPoint[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // --- 1. مراقب جاهزية المكتبة ---
  useEffect(() => {
    if (libState.leaflet && !mapRef.current) {
      initMap();
    }
  }, [libState.leaflet]);

  // --- 2. تهيئة الخريطة ---
  const initMap = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const L = (window as any).L;
      if (!L) return;

      const map = L.map('weather-map', {
        zoomControl: false,
        attributionControl: false,
        center: [34.0209, -6.8416],
        zoom: 6
      });

      // استخدام مزود خرائط يدعم CORS بشكل جيد
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19, zIndex: 0, crossOrigin: true
      }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19, zIndex: 1000, crossOrigin: true
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setIsMapReady(true);
      setStatus(""); // إخفاء التحميل
      
      initData(); // جلب البيانات

      map.on('moveend', () => {
         if (['temp', 'pressure', 'clouds'].includes(activeLayer)) loadGridData(map);
      });

      map.on('click', (e: any) => {
        handleAnalyzeLocation(e.latlng.lat, e.latlng.lng);
      });

    } catch (e) {
      console.error(e);
      setStatus("حدث خطأ في عرض الخريطة");
    }
  };

  // --- 3. جلب البيانات ---
  const initData = async () => {
      try {
        const frames = await fetchUnifiedTimeline();
        if (frames && frames.length > 0) {
            setTimeline(frames);
            // ضبط الوقت على "الآن"
            const now = Math.floor(Date.now() / 1000);
            let nowIdx = frames.findIndex((f: any) => f.ts > now);
            if (nowIdx === -1) nowIdx = frames.length - 1;
            if (nowIdx > 0) nowIdx--; 
            setCurrentIndex(nowIdx);
        }
        
        if (['temp', 'pressure', 'clouds'].includes(activeLayer) && mapRef.current) {
            loadGridData(mapRef.current);
        }
      } catch (e) {}
  };

  const loadGridData = async (map: any) => {
      const bounds = map.getBounds();
      let apiVar: any = 'temperature_2m';
      if (activeLayer === 'pressure') apiVar = 'pressure_msl';
      if (activeLayer === 'clouds') apiVar = 'cloudcover';

      if (['temp', 'pressure', 'clouds'].includes(activeLayer)) {
          const data = await fetchWeatherGrid(bounds.getNorth(), bounds.getSouth(), bounds.getEast(), bounds.getWest(), apiVar);
          setGridData(data);
      }
  };

  useEffect(() => {
      if (isMapReady && mapRef.current) {
          if (['temp', 'pressure', 'clouds'].includes(activeLayer)) {
              loadGridData(mapRef.current);
          } else {
              setGridData([]);
          }
      }
  }, [activeLayer, isMapReady]);

  useEffect(() => {
      let timer: any;
      if (isPlaying && timeline.length > 0) {
          timer = setTimeout(() => {
              setCurrentIndex(prev => (prev + 1) % timeline.length);
          }, 800);
      }
      return () => clearTimeout(timer);
  }, [isPlaying, timeline]);

  const handleAnalyzeLocation = async (lat: number, lng: number) => {
      setShowModels(true);
      const L = (window as any).L;
      if(mapRef.current) L.popup().setLatLng([lat, lng]).setContent('<div style="color:#333">جاري التحليل...</div>').openOn(mapRef.current);
      try {
        const data = await getWeather(lat, lng, `M: ${lat.toFixed(2)}`);
        setSelectedLocation({ lat, lng, data });
      } catch (err) { console.error(err); }
  };

  const formatTime = (ts: number) => ts ? new Date(ts * 1000).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }) : "--:--";

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans" dir="rtl">
      
      {/* تحميل المكتبات من cdnjs الموثوق */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet-velocity/1.5.2/leaflet-velocity.min.css" />

      {/* 1. Leaflet Core */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
        strategy="beforeInteractive"
        onLoad={() => setLibState(p => ({...p, leaflet: true}))}
      />

      {/* 2. Velocity Plugin (لا يمنع تحميل الصفحة إذا فشل) */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-velocity/1.5.2/leaflet-velocity.min.js"
        strategy="lazyOnload"
        onLoad={() => setLibState(p => ({...p, velocity: true}))}
        onError={() => console.warn("تعذر تحميل طبقة الرياح")}
      />
      
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="lazyOnload" />

      <div id="weather-map" className="absolute inset-0 z-0 bg-slate-900" />

      {/* شاشة الانتظار */}
      {status && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
              <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h2 className="text-xl font-bold text-white">{status}</h2>
              </div>
          </div>
      )}

      {/* الطبقات */}
      {isMapReady && mapRef.current && (
        <>
          {libState.velocity && <WindLayer map={mapRef.current} active={activeLayer === 'wind'} />}
          
          {['radar', 'satellite'].includes(activeLayer) && timeline.length > 0 && (
             <TileAnimator map={mapRef.current} type={activeLayer as any} frames={timeline} currentIndex={currentIndex} />
          )}

          {['temp', 'pressure', 'clouds'].includes(activeLayer) && (
             <HeatmapLayer map={mapRef.current} data={gridData} type={activeLayer as any} />
          )}
        </>
      )}

      {/* أدوات التحكم */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row justify-between items-start pointer-events-none gap-2">
         <div className="flex gap-2 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-xl">
              <Search className="text-slate-400 w-5 h-5" />
              <input type="text" placeholder="بحث..." className="bg-transparent border-none outline-none text-white text-sm w-32" />
            </div>
            {selectedLocation && (
              <button onClick={() => setShowModels(!showModels)} className="bg-blue-600 text-white p-2 rounded-2xl shadow-xl">
                <Table2 size={20} />
              </button>
            )}
         </div>

         <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 pointer-events-auto flex flex-wrap gap-1 justify-end shadow-xl">
            <Btn active={activeLayer === 'radar'} onClick={() => setActiveLayer('radar')} icon={<CloudRain size={18} />} label="رادار" />
            <Btn active={activeLayer === 'wind'} onClick={() => setActiveLayer('wind')} icon={<Wind size={18} />} label="رياح" />
            <Btn active={activeLayer === 'temp'} onClick={() => setActiveLayer('temp')} icon={<Thermometer size={18} />} label="حرارة" />
            <Btn active={activeLayer === 'clouds'} onClick={() => setActiveLayer('clouds')} icon={<Cloud size={18} />} label="سحب" />
            <Btn active={activeLayer === 'pressure'} onClick={() => setActiveLayer('pressure')} icon={<Gauge size={18} />} label="ضغط" />
            <Btn active={activeLayer === 'satellite'} onClick={() => setActiveLayer('satellite')} icon={<Layers size={18} />} label="أقمار" />
         </div>
      </div>

      {/* الخط الزمني */}
      <div className="absolute bottom-8 left-4 right-4 z-20 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl pointer-events-auto max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500">
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{timeline.length > 0 ? formatTime(timeline[0].ts) : '--:--'}</span>
                <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{timeline.length > 0 && timeline[currentIndex] ? formatTime(timeline[currentIndex].ts) : '--:--'}</span>
                <span>{timeline.length > 0 ? formatTime(timeline[timeline.length-1].ts) : '--:--'}</span>
              </div>
              <input type="range" min="0" max={Math.max(0, timeline.length - 1)} value={currentIndex} onChange={(e) => { setIsPlaying(false); setCurrentIndex(Number(e.target.value)); }} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* اللوحة الجانبية */}
      {selectedLocation && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-96 max-h-[80vh] overflow-y-auto custom-scrollbar pointer-events-auto pb-10">
          <RadarPanel data={selectedLocation.data} loading={false} onClose={() => { setSelectedLocation(null); setShowModels(false); }} />
          {showModels && <ModelComparison lat={selectedLocation.lat} lng={selectedLocation.lng} />}
        </div>
      )}
    </div>
  );
}

function Btn({ active, onClick, icon, label }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10'}`}>
            {icon}
            <span className="hidden sm:block text-xs font-bold">{label}</span>
        </button>
    );
}