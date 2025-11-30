// app/components/LivingScene.tsx
'use client';

import React from 'react';
import { WeatherData } from '../weather';
import { Sun, Moon, Cloud, CloudRain, Star } from 'lucide-react';

export default function LivingScene({ data }: { data: WeatherData }) {
  let skyGradient = "from-blue-400 to-blue-200";
  if (!data.isDay) skyGradient = "from-slate-900 via-slate-800 to-slate-900";
  else if (data.cloudCover > 80) skyGradient = "from-slate-400 to-slate-300";
  else if (data.description.includes("مطر")) skyGradient = "from-slate-600 to-slate-500";

  const isDry = data.soilMoisture < 0.25;
  const groundColor = isDry ? "bg-[#e6dba7]" : "bg-[#86c232]"; 
  const treeColor = isDry ? "text-[#b5a642]" : "text-[#4da332]";

  return (
    <div className={`absolute inset-0 bg-gradient-to-b ${skyGradient} transition-colors duration-1000 -z-10 overflow-hidden`}>
      {data.isDay ? (
        <div className="absolute top-10 right-10 animate-float-slow">
          {data.cloudCover > 60 ? <Cloud className="w-32 h-32 text-white/90" /> : <Sun className="w-32 h-32 text-yellow-300 drop-shadow-[0_0_40px_rgba(253,224,71,0.6)]" />}
        </div>
      ) : (
        <div className="absolute top-10 right-10">
          <Moon className="w-24 h-24 text-slate-200" />
          {data.cloudCover < 30 && <Star className="absolute top-20 left-40 w-4 h-4 text-white animate-pulse" />}
        </div>
      )}
      {data.description.includes("مطر") && (
        <div className="absolute inset-0 bg-[url('https://ssl.gstatic.com/onebox/weather/64/rain_light.png')] opacity-40 animate-rain"></div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-1/3">
        <div className={`absolute bottom-0 left-0 right-0 h-full ${groundColor} opacity-60 rounded-t-[50%] scale-125 translate-y-10 transition-colors duration-1000`}></div>
        <div className={`absolute bottom-0 left-0 right-0 h-3/4 ${groundColor} rounded-t-[30%] flex items-end justify-center overflow-hidden transition-colors duration-1000`}>
          <div className="absolute bottom-10 left-10 z-20">
             <div className="w-4 h-16 bg-amber-800 mx-auto rounded-full"></div>
             <div className={`w-24 h-24 ${treeColor} bg-current rounded-full -mt-12 shadow-lg relative`}>
                {data.windSpeed > 20 && <div className="animate-wiggle origin-bottom">🍃</div>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
