'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script'; 
import { 
  Play, Pause, Layers, Wind, CloudRain, Thermometer, Zap, 
  Activity, Search, Map as MapIcon, Navigation, Table2, Cloud, Gauge
} from 'lucide-react';
import { getWeather } from '../core/weather/api'; 
import { RadarAnalysis } from '../components/RadarAnalysis'; 
import { ModelComparison } from '../components/ModelComparison';

// مفتاح OpenWeatherMap للطبقات (يمكنك استبداله بمفتاحك الخاص للحصول على أداء أفضل)
const OWM_KEY = '9de243494c0b295cca9337e1e96b00e2'; 

export default function RadarPage() {
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // الطبقات الشاملة
  const [activeLayer, setActiveLayer] = useState<'radar' | 'satellite' | 'wind' | 'temp' | 'clouds' | 'pressure'>('radar');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showModels, setShowModels] = useState(false);

  const initMap = () => {
    if (typeof window === 'undefined' || !(window as any).L) return;
    const L = (window as any).L;

    if (mapRef.current) return;

    const map = L.map('weather-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([34.0209, -6.8416], 6);

    // الخريطة الداكنة (Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;
    setIsMapReady(true);

    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      handleAnalyzeLocation(lat, lng);
    });

    fetchRadarFrames();
  };

  const handleAnalyzeLocation = async (lat: number, lng: number) => {
    setLoadingAnalysis(true);
    const L = (window as any).L;
    
    L.popup()
      .setLatLng([lat, lng])
      .setContent('<div style="color:#333; font-weight:bold; font-size:12px">جاري سحب البيانات...</div>')
      .openOn(mapRef.current);

    try {
      const data = await getWeather(lat, lng, `موقع ${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      setSelectedLocation({ lat, lng, data });
    } catch (err) {
      console.error("Analysis Failed", err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchRadarFrames = async () => {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await res.json();
      
      const past = data.radar?.past || [];
      const nowcast = data.radar?.nowcast || [];
      const allFrames = [...past, ...nowcast].map((f: any) => f.time);
      
      if (allFrames.length > 0) {
        setTimestamps(allFrames);
        setCurrentTimeIndex(past.length - 1);
      }
    } catch (e) {
      console.error("RainViewer API Error", e);
    }
  };

  // إدارة الطبقات المتعددة
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const L = (window as any).L;

    // إزالة الطبقة السابقة
    mapRef.current.eachLayer((layer: any) => {
      if (layer.options?.id === 'weather-layer') {
        mapRef.current.removeLayer(layer);
      }
    });

    let layerUrl = '';
    const ts = timestamps[currentTimeIndex] || Math.floor(Date.now() / 1000); // وقت احتياطي

    // اختيار مصدر الطبقة
    switch (activeLayer) {
      case 'radar':
        // RainViewer: رادار المطر (يعمل مع التوقيت)
        layerUrl = `https://tile.rainviewer.com${timestamps.length > 0 ? timestamps[currentTimeIndex] : ''}/256/{z}/{x}/{y}/2/1_1.png`;
        break;
      case 'satellite':
        // RainViewer: أقمار صناعية (يعمل مع التوقيت)
        layerUrl = `https://tile.rainviewer.com${timestamps.length > 0 ? timestamps[currentTimeIndex] : ''}/256/{z}/{x}/{y}/0/0_0.png`;
        break;
      
      // OpenWeatherMap Layers (لا تدعم التوقيت بدقة RainViewer، لذا نستخدم الرابط المباشر)
      case 'wind':
        layerUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`;
        break;
      case 'temp':
        layerUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`;
        break;
      case 'clouds':
        layerUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`;
        break;
      case 'pressure':
        layerUrl = `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`;
        break;
    }

    if (layerUrl) {
      L.tileLayer(layerUrl, {
        id: 'weather-layer',
        opacity: activeLayer === 'radar' || activeLayer === 'satellite' ? 0.8 : 0.6,
        zIndex: 500
      }).addTo(mapRef.current);
    }

    // حركة الرادار (فقط للطبقات التي تدعم الزمن)
    let timer: any;
    if (isPlaying && (activeLayer === 'radar' || activeLayer === 'satellite')) {
      timer = setTimeout(() => {
        setCurrentTimeIndex((prev) => (prev + 1) % timestamps.length);
      }, 500);
    }
    return () => clearTimeout(timer);

  }, [currentTimeIndex, isMapReady, timestamps, activeLayer, isPlaying]);

  const formatTime = (ts: number) => {
    if (!ts) return "--:--";
    return new Date(ts * 1000).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans" dir="rtl">
      
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onLoad={initMap} />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" />

      <div id="weather-map" className="absolute inset-0 z-0 bg-slate-900" />

      {/* لوحة التحكم العلوية */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row justify-between items-start pointer-events-none gap-2">
        
        <div className="flex gap-2 pointer-events-auto">
          {/* البحث */}
          <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2">
            <Search className="text-slate-400 w-5 h-5" />
            <input type="text" placeholder="بحث..." className="bg-transparent border-none outline-none text-white text-sm w-24 sm:w-32 placeholder-slate-500" />
          </div>

          {/* زر المقارنة */}
          {selectedLocation && (
            <button 
              onClick={() => setShowModels(!showModels)}
              className={`bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2 transition-all ${showModels ? 'text-blue-400 border-blue-500/50' : 'text-white'}`}
            >
              <Table2 size={20} />
              <span className="text-xs font-bold hidden sm:inline">مقارنة</span>
            </button>
          )}
        </div>

        {/* شريط الأدوات الشامل (Layers) */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 pointer-events-auto flex flex-wrap gap-1 shadow-2xl max-w-[300px] sm:max-w-none justify-end">
          <button onClick={() => setActiveLayer('radar')} title="أمطار" className={`p-2 rounded-xl transition-all ${activeLayer === 'radar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}>
            <CloudRain size={18} />
          </button>
          <button onClick={() => setActiveLayer('wind')} title="رياح" className={`p-2 rounded-xl transition-all ${activeLayer === 'wind' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}>
            <Wind size={18} />
          </button>
          <button onClick={() => setActiveLayer('temp')} title="حرارة" className={`p-2 rounded-xl transition-all ${activeLayer === 'temp' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}>
            <Thermometer size={18} />
          </button>
          <button onClick={() => setActiveLayer('clouds')} title="سحب" className={`p-2 rounded-xl transition-all ${activeLayer === 'clouds' ? 'bg-gray-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}>
            <Cloud size={18} />
          </button>
          <button onClick={() => setActiveLayer('pressure')} title="ضغط" className={`p-2 rounded-xl transition-all ${activeLayer === 'pressure' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}>
            <Gauge size={18} />
          </button>
          <button onClick={() => setActiveLayer('satellite')} title="أقمار" className={`p-2 rounded-xl transition-all ${activeLayer === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'}`}>
            <Layers size={18} />
          </button>
        </div>
      </div>

      {/* مشغل الزمن (يظهر فقط مع الرادار والأقمار) */}
      {(activeLayer === 'radar' || activeLayer === 'satellite') && (
        <div className="absolute bottom-8 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl pointer-events-auto max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center text-white transition-all shadow-lg">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                  <span>-2H</span>
                  <span className="text-white font-bold text-xs bg-white/10 px-3 py-0.5 rounded border border-white/5">{formatTime(timestamps[currentTimeIndex])}</span>
                  <span>+30M</span>
                </div>
                <input type="range" min="0" max={timestamps.length - 1} value={currentTimeIndex} onChange={(e) => { setIsPlaying(false); setCurrentTimeIndex(Number(e.target.value)); }} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* اللوحة الجانبية */}
      {selectedLocation && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-96 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300 pointer-events-auto pb-20">
          <RadarAnalysis 
            data={selectedLocation.data} 
            loading={loadingAnalysis} 
            onClose={() => { setSelectedLocation(null); setShowModels(false); }} 
          />
          {showModels && (
            <div className="animate-in slide-in-from-top duration-300">
              <ModelComparison lat={selectedLocation.lat} lng={selectedLocation.lng} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}