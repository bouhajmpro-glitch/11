'use client';
import React, { useState, useEffect } from 'react';
import { Brain, Check, AlertTriangle, ArrowDown } from 'lucide-react';
import { analyzeWeatherModels, AnalysisResult } from '../analysis'; // تأكد من المسار

export default function AnalysisRoom({ lat, lon }: { lat: number, lon: number }) {
  const [res, setRes] = useState<AnalysisResult | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { analyzeWeatherModels(lat, lon).then(setRes); }, [lat, lon]);

  if (!res) return <div className="mt-6 p-4 text-center text-xs text-slate-400 bg-white/50 rounded-2xl">جاري التحليل...</div>;

  return (
    <div className="mt-6 bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-slate-900 p-4 flex justify-between text-white">
        <div className="flex gap-2"><Brain className="w-5 h-5 text-purple-400" /><span className="font-bold text-sm">الذكاء التحليلي</span></div>
        <span className="font-black text-lg text-green-400">{Math.round(res.consensusScore)}%</span>
      </div>
      <div className="p-4">
        <table className="w-full text-xs text-right">
          <thead><tr className="text-slate-400 border-b"><th className="pb-2">نموذج</th><th className="pb-2">حرارة</th></tr></thead>
          <tbody>{(showAll ? res.allModels : res.allModels.slice(0,3)).map((m,i) => <tr key={i} className="border-b"><td className="py-2">{m.name}</td><td className="py-2">{m.temp.toFixed(1)}°</td></tr>)}</tbody>
        </table>
        <button onClick={() => setShowAll(!showAll)} className="w-full mt-2 text-xs text-blue-500">عرض المزيد</button>
      </div>
    </div>
  );
}
