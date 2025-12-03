// app/radar/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, ChevronUp, ChevronDown, AlertTriangle, Brain, Check, Loader2, MapPin } from 'lucide-react';
// 1. الاستيراد الصحيح من النواة
import { analyzeWeatherModels, AnalysisResult, ModelForecast } from '../core/analysis/engine';
import { getLocationByIP } from '../core/weather/api';

const WeatherMap = dynamic(() => import('../Map'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500">جاري تحميل الرادار...</div> 
});

// 2. رسم بياني يدوي (SVG) لتجنب أخطاء Recharts
const SimpleChart = ({ data }: { data: ModelForecast[] }) => {
  if (!data || data.length === 0) return null;
  
  const temps = data.map(d => d.temp);
  const max = Math.max(...temps) || 10;
  const min = Math.min(...temps) || 0;
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.temp - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-32 w-full mt-4 bg-slate-800/50 rounded-xl relative overflow-hidden border border-white/5">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><linearGradient id="grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient></defs>
        <path d={`M0,100 L0,${100} ${points} L100,${100} Z`} fill="url(#grad)" />
        <polyline points={points} fill="none" stroke="#a78bfa" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute bottom-0 w-full flex justify-between px-2 text-[8px] text-slate-400">{data.map((d, i) => <span key={i}>{d.name.slice(0,3)}</span>)}</div>
    </div>
  );
};

const AnalysisSection = ({ lat, lon }: { lat: number, lon: number }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => { analyzeWeatherModels(lat, lon).then(setAnalysis); }, [lat, lon]);

  if (!analysis) return <div className="p-6 text-center text-slate-400 text-xs">جاري تحليل النماذج...</div>;

  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 transition-all duration-500 z-20 flex flex-col ${isPanelOpen ? 'h-[60vh]' : 'h-12'}`}>
      <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-t-xl border-t border-x border-white/10 shadow-lg">{isPanelOpen ? <ChevronDown className="w-5 h-5"/> : <ChevronUp className="w-5 h-5"/>}</button>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-purple-400"/> الذكاء التحليلي</h2>
          <div className="text-right"><span className="text-xs text-slate-400 block">دقة النظام</span><span className="text-xl font-black text-green-400">{Math.round(analysis.consensusScore)}%</span></div>
        </div>

        {analysis.selfIssuedAlert && (<div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-4 flex gap-3 items-center"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /><p className="text-red-400 text-xs font-bold">{analysis.selfIssuedAlert}</p></div>)}

        <div className="mb-6"><h3 className="text-xs font-bold text-slate-400 mb-2">تباين الحرارة</h3><SimpleChart data={analysis.allModels} /></div>

        <table className="w-full text-xs text-right text-slate-300">
          <thead><tr className="border-b border-white/10"><th className="pb-2">النموذج</th><th className="pb-2">الحرارة</th><th className="pb-2">المطر</th><th className="pb-2">الرياح</th></tr></thead>
          <tbody>
            {/* 3. تحديد الأنواع (m: ModelForecast) */}
            {analysis.allModels.map((m: ModelForecast, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 flex gap-2 items-center">{m.country} {m.name} {i===0 && <Check className="w-3 h-3 text-green-500"/>}</td>
                <td className="py-3 text-amber-400 font-mono">{m.temp.toFixed(1)}°</td>
                <td className="py-3 text-blue-400 font-mono">{m.rain > 0 ? m.rain : '-'}</td>
                <td className="py-3 font-mono">{m.wind.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function RadarPage() {
  const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        async () => { const ip = await getLocationByIP(); if (ip) setCoords(ip); else setCoords({ lat: 33.5731, lon: -7.5898 }); }
      );
    } else { setCoords({ lat: 33.5731, lon: -7.5898 }); }
  }, []);

  if (!coords) return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>;

  return (
    <div className="h-screen w-full relative bg-slate-900 flex flex-col overflow-hidden">
       <div className="absolute inset-0 z-0"><WeatherMap lat={coords.lat} lon={coords.lon} city="مركز الرصد" /></div>
       <AnalysisSection lat={coords.lat} lon={coords.lon} />
    </div>
  );
}
