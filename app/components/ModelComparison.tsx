'use client';
import React, { useEffect, useState } from 'react';
import { getModelsData } from '../core/weather/api';
import { Wind, Thermometer, CloudRain, CheckCircle2, ShieldCheck, Scale, Activity } from 'lucide-react';

export const ModelComparison = ({ lat, lng }: { lat: number, lng: number }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!lat || !lng) return;
      setLoading(true);
      const res = await getModelsData(lat, lng);
      setData(res);
      setLoading(false);
    };
    loadData();
  }, [lat, lng]);

  if (loading) return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-2xl mt-4">
      <Activity className="animate-spin mx-auto text-blue-500 mb-2" />
      <span className="text-slate-400 text-xs">جاري مقارنة النماذج العالمية الستة...</span>
    </div>
  );
  
  if (!data) return null;

  const scoreColor = data.score > 85 ? 'text-green-400' : (data.score > 60 ? 'text-yellow-400' : 'text-red-400');

  // مكون الصف الواحد للنموذج
  const ModelRow = ({ name, flag, modelData, highlight = false }: any) => (
    <div className={`grid grid-cols-4 gap-2 py-1.5 border-b border-white/5 items-center ${highlight ? 'bg-blue-500/10 rounded px-1' : ''}`}>
      <div className="flex items-center gap-2 text-right">
        <span className="text-xs">{flag}</span>
        <span className={`text-[10px] font-bold ${highlight ? 'text-blue-300' : 'text-slate-300'}`}>{name}</span>
      </div>
      <div className="text-center font-mono text-xs">{Math.round(modelData.temp)}°</div>
      <div className="text-center font-mono text-xs text-blue-400">{modelData.rain}%</div>
      <div className="text-center font-mono text-xs text-slate-400">{Math.round(modelData.wind)}</div>
    </div>
  );

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white shadow-2xl mt-4 animate-in slide-in-from-bottom duration-500">
      
      {/* الرأس: دقة التوقعات */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-purple-400" />
          <h3 className="text-xs font-bold text-white">تحليل الإجماع (6 نماذج)</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-xs">
          <span className="text-slate-400">الثقة:</span>
          <span className={`font-bold ${scoreColor}`}>{data.score}%</span>
        </div>
      </div>

      {/* عناوين الأعمدة */}
      <div className="grid grid-cols-4 gap-2 text-center text-[9px] text-slate-500 mb-2 uppercase tracking-wider">
        <div className="text-right pr-2">المصدر</div>
        <div>حرارة</div>
        <div>مطر</div>
        <div>رياح (km)</div>
      </div>

      {/* 1. التوقع الهجين (الأذكى) */}
      <div className="grid grid-cols-4 gap-2 py-2 bg-gradient-to-r from-blue-600/20 to-transparent rounded-lg items-center border border-blue-500/20 mb-2">
        <div className="flex items-center gap-2 text-right pr-2">
          <ShieldCheck size={14} className="text-green-400" />
          <span className="text-[10px] font-bold text-green-300">الذكاء الهجين</span>
        </div>
        <div className="text-center font-bold text-sm text-white">{data.hybridTemp}°</div>
        <div className="text-center text-[10px] text-slate-400">-</div>
        <div className="text-center text-[10px] text-slate-400">-</div>
      </div>

      {/* 2. النماذج الستة */}
      <div className="space-y-0.5">
        <ModelRow name="ECMWF" flag="🇪🇺" modelData={data.ecmwf} highlight />
        <ModelRow name="GFS" flag="🇺🇸" modelData={data.gfs} />
        <ModelRow name="ICON" flag="🇩🇪" modelData={data.icon} />
        <ModelRow name="ARPEGE" flag="🇫🇷" modelData={data.arpege} />
        <ModelRow name="GEM" flag="🇨🇦" modelData={data.gem} />
        <ModelRow name="BOM" flag="🇦🇺" modelData={data.bom} />
      </div>

    </div>
  );
};