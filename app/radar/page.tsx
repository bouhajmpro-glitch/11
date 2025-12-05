'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script'; 
import { 
  Play, Pause, Layers, Wind, CloudRain, Thermometer, Zap, 
  Search, Table2, Cloud, Gauge, Map as MapIcon, Navigation
} from 'lucide-react';
import { getWeather } from '../core/weather/api'; 
// استيراد دالة الشبكة
import { fetchWeatherGrid, GridDataPoint } from '../core/weather/api';

import RadarPanel from '../components/RadarPanel'; 
import ModelComparison from '../components/ModelComparison';
import WindLayer from '../components/WindLayer';
import WeatherLayers from '../components/WeatherLayers';
// استيراد الطبقة الجديدة
import HeatmapLayer from '../components/HeatmapLayer';

export default function RadarPage() {
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const [activeLayer, setActiveLayer] = useState<'radar' | 'satellite' | 'wind' | 'temp' | 'clouds' | 'pressure'>('radar');
  const [gridData, setGridData] = useState<GridDataPoint[]>([]); // بيانات الرسم
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showModels, setShowModels] = useState(false);

  // 1. تهيئة الخريطة
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      zIndex: 0
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      zIndex: 1000
    }).addTo(map);

    mapRef.current = map;
    setIsMapReady(true);

    // عند تحريك الخريطة، نعيد جلب بيانات الشبكة (فقط للطبقات التي تحتاجها)
    map.on('moveend', () => {
      if (['temp', 'pressure', 'clouds'].includes(activeLayer)) {
        updateGridData(activeLayer);
      }
    });

    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      handleAnalyzeLocation(lat, lng);
    });

    fetchRadarFrames();
  };

  // دالة تحديث بيانات الشبكة
  const updateGridData = async (layer: string) => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    let apiVar: 'temperature_2m' | 'pressure_msl' | 'cloudcover' = 'temperature_2m';
    if (layer === 'pressure') apiVar = 'pressure_msl';
    if (layer === 'clouds') apiVar = 'cloudcover';

    const data = await fetchWeatherGrid(north, south, east, west, apiVar);
    setGridData(data);
  };

  // مراقبة الطبقات
  useEffect(() => {
    if (isMapReady && ['temp', 'pressure', 'clouds'].includes(activeLayer)) {
      updateGridData(activeLayer);
    } else {
      setGridData([]);
    }
  }, [activeLayer, isMapReady]);

  // ... (باقي الدوال: handleAnalyzeLocation, fetchRadarFrames, Timer - انسخها من الكود السابق)
  const handleAnalyzeLocation = async (lat: number, lng: number) => {
      setLoadingAnalysis(true); setShowModels(true);
      const L = (window as any).L;
      L.popup().setLatLng([lat, lng]).setContent('<div style="color:#333;">جاري التحليل...</div>').openOn(mapRef.current);
      try {
        const data = await getWeather(lat, lng, `Location ${lat.toFixed(2)}`);
        setSelectedLocation({ lat, lng, data });
      } catch (err) { console.error(err); } finally { setLoadingAnalysis(false); }
  };

  const fetchRadarFrames = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        const past = data.radar?.past || [];
        const nowcast = data.radar?.nowcast || [];
        const allFrames = [...past, ...nowcast].map((f: any) => f.time);
        if (allFrames.length > 0) { setTimestamps(allFrames); setCurrentTimeIndex(past.length - 1); }
      } catch (e) { console.error(e); }
  };

  useEffect(() => {
      let timer: any;
      if (isPlaying && timestamps.length > 0) {
          timer = setTimeout(() => setCurrentTimeIndex(prev => (prev + 1) % timestamps.length), 500);
      }
      return () => clearTimeout(timer);
  }, [isPlaying, timestamps]);

  const formatTime = (ts: number) => ts ? new Date(ts * 1000).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }) : "--:--";
  const currentTs = (timestamps.length > 0 && timestamps[currentTimeIndex]) ? timestamps[currentTimeIndex] : 0;

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans" dir="rtl">
      
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onLoad={initMap} />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" />

      <div id="weather-map" className="absolute inset-0 z-0 bg-slate-900" />

      {isMapReady && (
        <>
          {/* 1. الرياح (مستقلة) */}
          <WindLayer map={mapRef.current} active={activeLayer === 'wind'} />
          
          {/* 2. الطبقات المصورة (الرادار / الأقمار) */}
          {['radar', 'satellite'].includes(activeLayer) && (
             <WeatherLayers map={mapRef.current} activeLayer={activeLayer} timestamp={currentTs} />
          )}

          {/* 3. الطبقة الرقمية "المدرعة" (للحرارة والضغط) */}
          {['temp', 'pressure', 'clouds'].includes(activeLayer) && (
             <HeatmapLayer map={mapRef.current} data={gridData} type={activeLayer as any} />
          )}
        </>
      )}

      {/* عناصر التحكم (الأزرار) */}
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
            <button onClick={() => setActiveLayer('radar')} title="رادار" className={`p-2 rounded-xl transition-all ${activeLayer === 'radar' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-white/5'}`}><CloudRain size={18} /></button>
            <button onClick={() => setActiveLayer('wind')} title="رياح" className={`p-2 rounded-xl transition-all ${activeLayer === 'wind' ? 'bg-teal-600 text-white' : 'text-slate-400 bg-white/5'}`}><Wind size={18} /></button>
            <button onClick={() => setActiveLayer('temp')} title="حرارة" className={`p-2 rounded-xl transition-all ${activeLayer === 'temp' ? 'bg-orange-600 text-white' : 'text-slate-400 bg-white/5'}`}><Thermometer size={18} /></button>
            <button onClick={() => setActiveLayer('clouds')} title="سحب" className={`p-2 rounded-xl transition-all ${activeLayer === 'clouds' ? 'bg-gray-600 text-white' : 'text-slate-400 bg-white/5'}`}><Cloud size={18} /></button>
            <button onClick={() => setActiveLayer('pressure')} title="ضغط" className={`p-2 rounded-xl transition-all ${activeLayer === 'pressure' ? 'bg-purple-600 text-white' : 'text-slate-400 bg-white/5'}`}><Gauge size={18} /></button>
            <button onClick={() => setActiveLayer('satellite')} title="أقمار" className={`p-2 rounded-xl transition-all ${activeLayer === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400 bg-white/5'}`}><Layers size={18} /></button>
         </div>
      </div>

      {/* شريط الزمن */}
      {(activeLayer === 'radar' || activeLayer === 'satellite') && (
        <div className="absolute bottom-8 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl pointer-events-auto max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center text-white">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                  <span>-2H</span>
                  <span className="text-white font-bold text-xs bg-white/10 px-3 py-0.5 rounded border border-white/5">{formatTime(timestamps[currentTimeIndex])}</span>
                  <span>+30M</span>
                </div>
                <input type="range" min="0" max={Math.max(0, timestamps.length - 1)} value={currentTimeIndex} onChange={(e) => { setIsPlaying(false); setCurrentTimeIndex(Number(e.target.value)); }} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-96 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300 pointer-events-auto pb-20 space-y-4">
          <RadarPanel data={selectedLocation.data} loading={loadingAnalysis} onClose={() => { setSelectedLocation(null); setShowModels(false); }} />
          {showModels && <ModelComparison lat={selectedLocation.lat} lng={selectedLocation.lng} />}
        </div>
      )}
    </div>
  );
}