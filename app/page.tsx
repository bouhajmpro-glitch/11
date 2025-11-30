// app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  CloudSun, CloudRain, Sun, Moon, Wind, Droplets, Navigation, Search, Loader2, MapPin, Edit2, Check, BookOpen,
  Shirt, Car, HeartPulse, Coffee, Umbrella, Thermometer, Eye, Battery, Zap, Anchor, Tent, Trees, AlertTriangle, Snowflake,
  Activity, Fish, Flame, Smile, Telescope, Bug, Volume2, StopCircle, Radio, X, Megaphone, ThumbsUp,
  Rocket, Microscope, Globe, ExternalLink, Info, Brain, BarChart3, ArrowDown, Clock
} from 'lucide-react';
// استيراد الدوال من المحرك
import { getWeather, searchCities, getLocationByIP, getCityNameFromCoords } from './core/weather/api';
// استيراد الأنواع من القاموس (هذا هو التصحيح)
import { WeatherData, CityResult } from './core/weather/types';
import { getGlobalHazards, Hazard } from './hazards';
import { supabase } from './lib/supabaseClient';
import LivingScene from './components/LivingScene';
import { analyzeWeatherModels, AnalysisResult } from './analysis';

// الخريطة
const WeatherMap = dynamic(() => import('./Map'), { ssr: false });

// نافذة الأخبار
const NewsModal = ({ hazard, onClose }: { hazard: Hazard, onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
      <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
        <h3 className="font-bold flex gap-2"><Activity className="w-4 h-4"/> التفاصيل</h3>
        <button onClick={onClose}><X className="w-5 h-5"/></button>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">{hazard.title}</h2>
        <p className="text-slate-600 text-sm mb-4">{hazard.details}</p>
        {hazard.url && <a href={hazard.url} target="_blank" className="text-blue-600 underline text-xs">المصدر</a>}
      </div>
    </div>
  </div>
);

// شريط الأخبار
const HazardTicker = () => {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [visible, setVisible] = useState(true);
  const [selected, setSelected] = useState<Hazard | null>(null);

  useEffect(() => { getGlobalHazards().then(setHazards); }, []);

  if (!visible || hazards.length === 0) return null;

  return (
    <>
      {selected && <NewsModal hazard={selected} onClose={() => setSelected(null)} />}
      <div className="bg-slate-900 text-white p-2 relative z-50 border-b border-white/10 overflow-hidden">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {hazards.map(h => (
            <button key={h.id} onClick={() => setSelected(h)} className="flex items-center gap-2 text-xs hover:text-blue-300">
              <Activity className="w-3 h-3 text-red-400" /> {h.title}
            </button>
          ))}
        </div>
        <button onClick={() => setVisible(false)} className="absolute left-2 top-2 text-white/50"><X className="w-4 h-4"/></button>
      </div>
    </>
  );
};

// باقي المكونات (مختصرة للنسخ الآمن)
const InfoCard = ({ item }: { item: any }) => (
  <div className="bg-white/80 backdrop-blur p-3 rounded-xl flex flex-col items-center text-center border border-white/20">
    <item.icon className={`w-5 h-5 mb-1 ${item.color}`} />
    <span className="text-xs font-bold text-slate-500">{item.title}</span>
    <span className="text-sm font-black text-slate-800">{item.val}</span>
  </div>
);

const WeatherHero = ({ data }: { data: WeatherData }) => (
  <div className="text-center text-white py-10 relative z-10">
    <h1 className="text-9xl font-thin tracking-tighter">{data.temp}°</h1>
    <p className="text-2xl opacity-90">{data.description}</p>
    <div className="flex justify-center gap-6 mt-4 opacity-80 text-sm font-bold">
      <span>💧 {data.humidity}%</span><span>💨 {data.windSpeed} كم/س</span>
    </div>
  </div>
);

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: 33.5731, lon: -7.5898 });

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true); setCoords({ lat, lon });
    const data = await getWeather(lat, lon, name);
    setWeather(data); setLoading(false);
  }, []);

  useEffect(() => {
    getLocationByIP().then(ip => { if (ip) fetchWeather(ip.lat, ip.lon, ip.city); });
  }, [fetchWeather]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">تحميل...</div>;
  if (!weather) return null;

  return (
    <main className="min-h-screen relative font-sans overflow-x-hidden pb-20">
      <LivingScene data={weather} />
      <HazardTicker />
      <WeatherHero data={weather} />
      {/* أضف باقي المكونات هنا (الرادار، التحليل، إلخ) */}
      <div className="p-4 relative z-10">
        <div className="bg-white/10 backdrop-blur p-4 rounded-2xl mt-8">
          <h3 className="text-white font-bold mb-2">الرادار</h3>
          <WeatherMap lat={coords.lat} lon={coords.lon} city={weather.city} />
        </div>
      </div>
    </main>
  );
}
