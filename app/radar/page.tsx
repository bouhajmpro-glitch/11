// app/radar/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Brain, Check } from 'lucide-react';
import { getLocationByIP } from '../weather';
import { analyzeWeatherModels, AnalysisResult } from '../analysis';

const WeatherMap = dynamic(() => import('../Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500">جاري تحميل الرادار...</div>
});

const AnalysisSection = ({ lat, lon }: { lat: number, lon: number }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => { analyzeWeatherModels(lat, lon).then(setAnalysis); }, [lat, lon]);

  if (!analysis) return <div className="p-6 text-center text-slate-400 text-xs">جاري تحليل النماذج...</div>;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden max-w-md mx-auto mt-4">
      <div className="bg-slate-900 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white"><Brain className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-sm">الذكاء التحليلي</h3></div>
        <span className={`font-black text-lg ${analysis.consensusScore > 80 ? 'text-green-400' : 'text-red-400'}`}>{Math.round(analysis.consensusScore)}%</span>
      </div>
      <div className="p-4 h-64 overflow-y-auto">
        <table className="w-full text-xs text-right">
          <thead className="text-slate-400 border-b"><tr><th className="pb-2">النموذج</th><th className="pb-2">حرارة</th><th className="pb-2">مطر</th></tr></thead>
          <tbody className="text-slate-600">
            {analysis.allModels.map((m, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2 flex items-center gap-1">{m.country} {m.name} {i===0 && <Check className="w-3 h-3 text-blue-500"/>}</td>
                <td className="py-2">{m.temp?.toFixed(1)}°</td>
                <td className="py-2">{m.rain > 0 ? m.rain.toFixed(1) : '-'}</td>
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
        async () => {
          const ip = await getLocationByIP();
          if (ip) setCoords(ip); else setCoords({ lat: 33.5731, lon: -7.5898 });
        }
      );
    } else { setCoords({ lat: 33.5731, lon: -7.5898 }); }
  }, []);

  if (!coords) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600"/></div>;

  return (
    <div className="h-screen w-full relative flex flex-col pb-20">
       <div className="flex-1 relative z-0">
         <WeatherMap lat={coords.lat} lon={coords.lon} city="مركز الرصد" />
       </div>
       <div className="absolute bottom-24 left-4 right-4 z-10">
         <AnalysisSection lat={coords.lat} lon={coords.lon} />
       </div>
    </div>
  );
}
