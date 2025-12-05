'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script'; 
import { 
  Play, Pause, Layers, Wind, CloudRain, Thermometer, Zap, 
  Search, Table2, Cloud, Gauge, Map as MapIcon, Navigation
} from 'lucide-react';
import { getWeather, fetchUnifiedTimeline, fetchWeatherGrid, GridDataPoint } from '../core/weather/api'; 

// استيراد المكونات (تأكد من الأسماء)
import RadarPanel from '../components/RadarPanel'; 
import ModelComparison from '../components/ModelComparison';
import WindLayer from '../components/WindLayer';
import TileAnimator from '../components/TileAnimator';
import HeatmapLayer from '../components/HeatmapLayer';

export default function RadarPage() {
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // الطبقات المتاحة
  const [activeLayer, setActiveLayer] = useState<'radar' | 'satellite' | 'wind' | 'temp' | 'clouds' | 'pressure'>('radar');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // بيانات الرسم الحي (للحرارة والضغط)
  const [gridData, setGridData] = useState<GridDataPoint[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showModels, setShowModels] = useState(false);

  const initMap = () => {
    if (typeof window === 'undefined' || !(window as any).L) return;
    const L = (window as any).L;
    if (mapRef.current) return;

    (window as any).L = L;

    const map = L.map('weather-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([34.0209, -6.8416], 5);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // الخلفية
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      zIndex: 0
    }).addTo(map);

    // الأسماء
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      zIndex: 1000
    }).addTo(map);

    mapRef.current = map;
    setIsMapReady(true);

    // تحديث البيانات عند التحريك (للطبقات الحية فقط)
    map.on('moveend', () => {
       if (['temp', 'pressure', 'clouds'].includes(activeLayer)) {
           loadGridData(map);
       }
    });

    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      handleAnalyzeLocation(lat, lng);
    });

    initData(map);
  };

  const initData = async (map: any) => {
      // 1. جلب خط الزمن للرادار
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
      
      // 2. تحميل بيانات الشبكة الحالية
      loadGridData(map);
  };

  const loadGridData = async (map: any) => {
      const bounds = map.getBounds();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();

      let apiVar: 'temperature_2m' | 'pressure_msl' | 'cloudcover' = 'temperature_2m';
      if (activeLayer === 'pressure') apiVar = 'pressure_msl';
      if (activeLayer === 'clouds') apiVar = 'cloudcover';

      // جلب البيانات فقط إذا كنا في طبقة تدعم ذلك
      if (['temp', 'pressure', 'clouds'].includes(activeLayer)) {
          const data = await fetchWeatherGrid(north, south, east, west, apiVar);
          setGridData(data);
      }
  };

  // عند تغيير الطبقة، نحمل البيانات المطلوبة
  useEffect(() => {
      if (isMapReady) {
          if (['temp', 'pressure', 'clouds'].includes(activeLayer)) {
              loadGridData(mapRef.current);
          } else {
              setGridData([]); // تنظيف
          }
      }
  }, [activeLayer, isMapReady]);

  // المشغل
  useEffect(() => {
      let timer: any;
      if (isPlaying && timeline.length > 0) {
          timer = setTimeout(() => {
              setCurrentIndex(prev => (prev + 1) % timeline.length);
          }, 500);
      }
      return () => clearTimeout(timer);
  }, [isPlaying, timeline]);

  // التحليل
  const handleAnalyzeLocation = async (lat: number, lng: number) => {
      setLoadingAnalysis(true); setShowModels(true);
      const L = (window as any).L;
      L.popup().setLatLng([lat, lng]).setContent('<div style="color:#333;">جاري التحليل...</div>').openOn(mapRef.current);
      try {
        const data = await getWeather(lat, lng, `Location ${lat.toFixed(2)}`);
        setSelectedLocation({ lat, lng, data });
      } catch (err) { console.error(err); } finally { setLoadingAnalysis(false); }
  };

  const formatTime = (ts: number) => ts ? new Date(ts * 1000).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }) : "--:--";

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans" dir="rtl">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onLoad={initMap} />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" />

      <div id="weather-map" className="absolute inset-0 z-0 bg-slate-900" />

      {isMapReady && (
        <>
          {/* 1. طبقة الرياح (مستقلة) */}
          <WindLayer map={mapRef.current} active={activeLayer === 'wind'} />

          {/* 2. طبقة الرادار والأقمار (متحركة) */}
          {['radar', 'satellite'].includes(activeLayer) && timeline.length > 0 && (
             <TileAnimator 
                map={mapRef.current} 
                type={activeLayer as any} 
                frames={timeline} 
                currentIndex={currentIndex} 
             />
          )}

          {/* 3. طبقة الحرارة والضغط (رسم حي) */}
          {['temp', 'pressure', 'clouds'].includes(activeLayer) && (
             <HeatmapLayer 
                map={mapRef.current} 
                data={gridData} 
                type={activeLayer as any} 
             />
          )}
        </>
      )}

      {/* واجهة التحكم */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row justify-between items-start pointer-events-none gap-2">
         <div className="flex gap-2 pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2">
              <Search className="text-slate-400 w-5 h-5" />
              <input type="text" placeholder="بحث..." className="bg-transparent border-none outline-none text-white text-sm w-32" />
            </div>
            {selectedLocation && (
              <button onClick={() => setShowModels(!showModels)} className="bg-slate-900/80 p-2 rounded-2xl text-blue-400">
                <Table2 size={20} />
              </button>
            )}
         </div>

         <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 pointer-events-auto flex flex-wrap gap-1 shadow-2xl max-w-[300px] sm:max-w-none justify-end">
            <button onClick={() => setActiveLayer('radar')} className={`p-2 rounded-xl transition-all ${activeLayer === 'radar' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-white/5'}`}><CloudRain size={18} /></button>
            <button onClick={() => setActiveLayer('wind')} className={`p-2 rounded-xl transition-all ${activeLayer === 'wind' ? 'bg-teal-600 text-white' : 'text-slate-400 bg-white/5'}`}><Wind size={18} /></button>
            <button onClick={() => setActiveLayer('temp')} className={`p-2 rounded-xl transition-all ${activeLayer === 'temp' ? 'bg-orange-600 text-white' : 'text-slate-400 bg-white/5'}`}><Thermometer size={18} /></button>
            <button onClick={() => setActiveLayer('clouds')} className={`p-2 rounded-xl transition-all ${activeLayer === 'clouds' ? 'bg-gray-600 text-white' : 'text-slate-400 bg-white/5'}`}><Cloud size={18} /></button>
            <button onClick={() => setActiveLayer('pressure')} className={`p-2 rounded-xl transition-all ${activeLayer === 'pressure' ? 'bg-purple-600 text-white' : 'text-slate-400 bg-white/5'}`}><Gauge size={18} /></button>
            <button onClick={() => setActiveLayer('satellite')} className={`p-2 rounded-xl transition-all ${activeLayer === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-white/5'}`}><Layers size={18} /></button>
         </div>
      </div>

      {/* شريط الزمن */}
      <div className="absolute bottom-8 left-4 right-4 z-20 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl pointer-events-auto max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center text-white">
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                <span>{timeline.length > 0 ? formatTime(timeline[0].ts) : '--:--'}</span>
                <span className="text-white font-bold text-xs bg-white/10 px-3 py-0.5 rounded border border-white/5">
                  {timeline.length > 0 ? formatTime(timeline[currentIndex]?.ts) : 'جاري التحميل...'}
                </span>
                <span>{timeline.length > 0 ? formatTime(timeline[timeline.length-1].ts) : '--:--'}</span>
              </div>
              <input type="range" min="0" max={Math.max(0, timeline.length - 1)} value={currentIndex} onChange={(e) => { setIsPlaying(false); setCurrentIndex(Number(e.target.value)); }} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {selectedLocation && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-96 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300 pointer-events-auto pb-20 space-y-4">
          <RadarPanel data={selectedLocation.data} loading={loadingAnalysis} onClose={() => { setSelectedLocation(null); setShowModels(false); }} />
          {showModels && <ModelComparison lat={selectedLocation.lat} lng={selectedLocation.lng} />}
        </div>
      )}
    </div>
  );
}