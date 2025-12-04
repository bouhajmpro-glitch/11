'use client';
import React, { useState } from 'react';
import { Activity, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';
import { WeatherData } from '../core/weather/types';

export const SmartNowcast = ({ data }: { data: WeatherData }) => {
  const [voted, setVoted] = useState<string | null>(null);

  // نستخدم بيانات الـ 15 دقيقة الحقيقية (أول 8 قيم = ساعتين)
  const chartData = data.minutely15?.rain?.slice(0, 8) || Array(8).fill(0);

  return (
    <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-2xl mb-8 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 p-4 opacity-10 animate-pulse"><Zap size={120} /></div>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h2 className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-2 uppercase tracking-wider">
            <Activity className="w-3 h-3" /> دقة عالية (15 دقيقة)
          </h2>
          <p className="text-lg font-bold leading-tight max-w-lg">
            {data.rainAmount > 0 
                ? `أمطار متوقعة (${data.rainAmount}مم). احتمالية ${data.rainProb}% خلال الساعة.` 
                : "الجو مستقر تماماً خلال الساعتين القادمتين."}
          </p>
        </div>
        <div className="flex flex-col items-center bg-black/30 p-2 rounded-xl backdrop-blur-md border border-white/5">
          <span className="text-[9px] text-white/60 mb-1">الدقة؟</span>
          <div className="flex gap-2">
            <button onClick={() => setVoted('up')} className={`p-1.5 rounded-lg transition ${voted === 'up' ? 'bg-green-500' : 'bg-white/5'}`}><ThumbsUp size={14} /></button>
            <button onClick={() => setVoted('down')} className={`p-1.5 rounded-lg transition ${voted === 'down' ? 'bg-red-500' : 'bg-white/5'}`}><ThumbsDown size={14} /></button>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mt-6 h-12 gap-1 px-1">
        {chartData.map((rainVal, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
             <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-black/80 text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">
               {rainVal}mm
             </div>
             <div 
               className={`w-full rounded-t-sm transition-all ${rainVal > 0 ? 'bg-blue-500' : 'bg-white/5'}`} 
               style={{ height: rainVal > 0 ? `${Math.min(rainVal * 20 + 10, 100)}%` : '4px' }}
             />
             <span className="text-[9px] text-white/30 mt-1">+{i * 15}د</span>
          </div>
        ))}
      </div>
    </div>
  );
};