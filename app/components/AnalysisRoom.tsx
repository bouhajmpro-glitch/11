// app/components/AnalysisRoom.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Check, AlertTriangle, ArrowDown, BarChart3 } from 'lucide-react';

// --- 1. تعريف الأنواع والمنطق داخلياً (لحل مشكلة المسار) ---
export interface ModelForecast {
  name: string;
  country: string;
  temp: number;
  rain: number;
  wind: number;
}

export interface AnalysisResult {
  bestPrediction: ModelForecast;
  consensusScore: number;
  disagreementAlert: string | null;
  selfIssuedAlert: string | null;
  allModels: ModelForecast[];
}

// دالة التحليل (مدمجة)
const analyzeWeatherModels = async (lat: number, lon: number): Promise<AnalysisResult> => {
  try {
    // محاكاة ذكية للبيانات (أو استبدالها بـ fetch حقيقي)
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`);
    const data = await res.json();
    const baseTemp = data.current.temperature_2m;

    const allModels: ModelForecast[] = [
      { name: "ECMWF", country: "🇪🇺", temp: baseTemp, rain: 0, wind: 12 },
      { name: "GFS", country: "🇺🇸", temp: baseTemp + 0.4, rain: 0, wind: 15 },
      { name: "ICON", country: "🇩🇪", temp: baseTemp - 0.2, rain: 0, wind: 10 },
      { name: "GEM", country: "🇨🇦", temp: baseTemp - 0.5, rain: 0, wind: 18 },
    ];

    return {
      bestPrediction: allModels[0],
      consensusScore: 94,
      disagreementAlert: null,
      selfIssuedAlert: null,
      allModels
    };
  } catch (e) {
    return { bestPrediction: { name: "-", country: "-", temp: 0, rain: 0, wind: 0 }, consensusScore: 0, disagreementAlert: null, selfIssuedAlert: null, allModels: [] };
  }
};

// --- 2. المكون ---
export default function AnalysisRoom({ lat, lon }: { lat: number, lon: number }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { analyzeWeatherModels(lat, lon).then(setAnalysis); }, [lat, lon]);

  if (!analysis) return <div className="mt-6 p-6 text-center text-slate-400 text-xs bg-white/50 rounded-2xl border border-slate-100">جاري التحليل...</div>;

  return (
    <div className="mt-6 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-slate-900 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white"><Brain className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-sm">الذكاء التحليلي</h3></div>
        <span className={`font-black text-lg ${analysis.consensusScore > 80 ? 'text-green-400' : 'text-red-400'}`}>{Math.round(analysis.consensusScore)}%</span>
      </div>
      
      {analysis.selfIssuedAlert && (<div className="bg-red-50 p-3 border-b border-red-100 flex gap-3 items-start"><AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /><p className="text-red-600 text-[10px]">{analysis.selfIssuedAlert}</p></div>)}
      
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead><tr className="text-slate-400 border-b"><th className="pb-2">النموذج</th><th className="pb-2">الحرارة</th><th className="pb-2">المطر</th></tr></thead>
            <tbody className="text-slate-600">
              {(showAll ? analysis.allModels : analysis.allModels.slice(0, 3)).map((m, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2">{m.country} {m.name}</td>
                  <td className="py-2">{m.temp.toFixed(1)}°</td>
                  <td className="py-2">{m.rain > 0 ? `${m.rain}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setShowAll(!showAll)} className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-slate-400 py-2 border-t border-slate-50">
          {showAll ? "إخفاء" : "عرض المزيد"} <ArrowDown className={`w-3 h-3 ${showAll ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
