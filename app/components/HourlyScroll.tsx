'use client';
import React from 'react';
import { Cloud, CloudRain, Sun, Moon, Wind } from 'lucide-react';
import { WeatherData } from '../core/weather/types';

export const HourlyScroll = ({ data }: { data: WeatherData }) => {
  const getIcon = (code: number, isDay: boolean) => {
    if (code >= 95) return <Wind size={20} className="text-purple-400" />;
    if (code >= 51) return <CloudRain size={20} className="text-blue-400" />;
    if (code >= 3) return <Cloud size={20} className="text-gray-400" />;
    return isDay ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-200" />;
  };

  return (
    <div className="mt-8 mb-12">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="h-5 w-1 bg-blue-500 rounded-full"></div>
        <h3 className="text-white/90 font-bold text-md">توقعات الساعات القادمة</h3>
      </div>
      
      <div className="flex overflow-x-auto gap-3 pb-4 px-2 no-scrollbar scroll-smooth">
        {data.hourly.time.map((t, i) => {
          const date = new Date(t);
          const hour = date.getHours();
          const isNow = i === 0;
          
          return (
            <div 
              key={i} 
              className={`min-w-[70px] flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${
                isNow 
                  ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/50 scale-105' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <span className={`text-xs mb-2 ${isNow ? 'text-white font-bold' : 'text-slate-400'}`}>
                {isNow ? 'الآن' : `${hour}:00`}
              </span>
              
              <div className="mb-2">
                {getIcon(data.hourly.weatherCode[i], (hour > 6 && hour < 19))}
              </div>
              
              <span className="text-sm font-bold text-white mb-1">
                {Math.round(data.hourly.temp[i])}°
              </span>
              
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-blue-300">
                  {data.hourly.rain[i]}%
                </span>
                <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-400" style={{ width: `${data.hourly.rain[i]}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};