'use client';
import React, { useEffect, useState } from 'react';
import { getModelsData } from '../core/weather/api';
import { Wind, Thermometer, CloudRain, ShieldCheck, Scale, Activity, ArrowDown } from 'lucide-react';

// التغيير الحاسم: export default لتسهيل الاستيراد
export default function ModelComparison({ lat, lng }: { lat: number, lng: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!lat || !lng) return;
      setLoading(true);
      try {
        const res = await getModelsData(lat, lng);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lat, lng]);

  if (loading) return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-2xl mt-4 animate-pulse">
      <Activity className="animate-spin mx-auto text-blue-500 mb-2" />
      <span className="text-slate-400 text-xs">جاري جلب بيانات 6 نماذج عالمية...</span>
    </div>
  );
  
  if (!data) return (
    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs text-red-300">
      فشل في تحميل مقارنة النماذج.
    </div>
  );

  const scoreColor = data.score > 85 ? 'text-green-400' : (data.score > 60 ? 'text-yellow-400' : 'text-red-400');

  // مكون فرعي للصفوف
  const ModelRow = ({ name, flag, modelData, highlight = false }: any) => (
    <div className={`grid grid-cols-4 gap-2 py-2 border-b border-white/5 items-center ${highlight ? 'bg-blue-500/10 rounded px-1' : ''}`}>
      <div className="flex items-center gap-2 text-right">
        <span className="text-xs">{flag}</span>
        <span className={`text-[10px] font-bold ${highlight ? 'text-blue-300' : 'text-slate-300'}`}>{name}</span>
      </div>
      <div className="text-center font-mono text-xs">{Math.round(modelData?.temp || 0)}°</div>
      <div className="text-center font-mono text-xs text-blue-400">{modelData?.rain || 0}%</div>
      <div className="text-center font-mono text-xs text-slate-400">{Math.round(modelData?.wind || 0)}</div>
    </div>
  );

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white shadow-2xl mt-4 animate-in slide-in-from-bottom duration-500 ring-1 ring-white/10">
      
      {/* الرأس */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-purple-400" />
          <h3 className="text-xs font-bold text-white">إجماع النماذج (Consensus)</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded text-xs border border-white/5">
          <span className="text-slate-400">الثقة:</span>
          <span className={`font-bold ${scoreColor}`}>{data.score}%</span>
        </div>
      </div>

      {/* العناوين */}
      <div className="grid grid-cols-4 gap-2 text-center text-[9px] text-slate-500 mb-2 uppercase tracking-wider font-bold">
        <div className="text-right pr-2">المصدر</div>
        <div className="flex justify-center"><Thermometer size={12}/></div>
        <div className="flex justify-center"><CloudRain size={12}/></div>
        <div className="flex justify-center"><Wind size={12}/></div>
      </div>

      {/* التوقع الهجين (الأهم) */}
      <div className="grid grid-cols-4 gap-2 py-2 bg-gradient-to-r from-emerald-900/40 to-transparent rounded-lg items-center border border-emerald-500/20 mb-3 shadow-lg">
        <div className="flex items-center gap-2 text-right pr-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-100">الهجين الذكي</span>
        </div>
        <div className="text-center font-bold text-sm text-white">{data.hybridTemp}°</div>
        <div className="text-center text-[10px] text-emerald-200/50 italic">مدمج</div>
        <div className="text-center text-[10px] text-emerald-200/50 italic">مدمج</div>
      </div>

      {/* قائمة النماذج */}
      <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        <ModelRow name="ECMWF" flag="🇪🇺" modelData={data.ecmwf} highlight />
        <ModelRow name="GFS" flag="🇺🇸" modelData={data.gfs} />
        <ModelRow name="ICON" flag="🇩🇪" modelData={data.icon} />
        <ModelRow name="ARPEGE" flag="🇫🇷" modelData={data.arpege} />
        <ModelRow name="GEM" flag="🇨🇦" modelData={data.gem} />
        <ModelRow name="BOM" flag="🇦🇺" modelData={data.bom} />
      </div>
      
      <div className="mt-3 pt-2 border-t border-white/5 text-center">
        <span className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
          <ArrowDown size={10} /> يتم تحديث البيانات كل ساعة
        </span>
      </div>
    </div>
  );
}