'use client';
import React, { useState, useMemo } from 'react';
import { 
  Wind, Droplets, Navigation, Thermometer, Eye, Sun, CloudRain, 
  Activity, Umbrella, CloudFog, Leaf, Snowflake, Sunrise, Sunset, 
  Moon, Zap, Car, Shirt, Flame, HeartPulse, Smile, Bug, Fish, 
  Tent, Waves, Bike, Dumbbell, Dog, Coffee, Hammer, Camera, Plane, 
  TreeDeciduous, Baby, Anchor, Star, HelpCircle
} from 'lucide-react';
import { WeatherData } from '../core/weather/types';
import { generateInsights } from '../core/analysis/insights';

const iconMap: { [key: string]: any } = {
  Car, Shirt, Flame, HeartPulse, Activity, Smile, Bug, Thermometer,
  CloudFog, Fish, Tent, Waves, Bike, Dumbbell, Dog, Leaf, Coffee,
  Hammer, Camera, Plane, TreeDeciduous, Baby, Anchor, Star,
  Wind, Droplets, Navigation, Eye, Sun, CloudRain, Umbrella, Snowflake,
  Sunrise, Sunset, Moon, Zap
};

export const IndicatorsGrid = ({ data }: { data: WeatherData }) => {
  const [activeTab, setActiveTab] = useState<'lifestyle' | 'technical'>('lifestyle');
  const lifestyleList = useMemo(() => generateInsights(data), [data]);

  const technicalList = [
    { title: "الحرارة", val: `${Math.round(data.temp)}°`, iconName: "Thermometer", color: "text-orange-400" },
    { title: "المحسوسة", val: `${Math.round(data.feelsLike)}°`, iconName: "Thermometer", color: "text-orange-600" },
    { title: "الرطوبة", val: `${data.humidity}%`, iconName: "Droplets", color: "text-blue-400" },
    { title: "الندى", val: `${data.dewPoint}°`, iconName: "Droplets", color: "text-cyan-300" },
    { title: "الضغط", val: `${data.pressure}`, iconName: "Activity", color: "text-purple-300" },
    { title: "الرياح", val: `${data.windSpeed}`, iconName: "Wind", color: "text-teal-300" },
    { title: "الاتجاه", val: data.windDir ? `${data.windDir}°` : "-", iconName: "Navigation", color: "text-slate-400" },
    { title: "الهبات", val: `${data.windGusts}`, iconName: "Wind", color: "text-teal-500" },
    { title: "الغيوم", val: `${data.cloudCover}%`, iconName: "CloudRain", color: "text-gray-400" },
    { title: "الرؤية", val: `${(data.visibility/1000).toFixed(1)}km`, iconName: "Eye", color: "text-emerald-300" },
    { title: "UV", val: `${data.uvIndex}`, iconName: "Sun", color: "text-yellow-400" },
    { title: "جودة الهواء", val: `${data.airQuality}`, iconName: "Leaf", color: "text-green-500" },
    { title: "فرصة المطر", val: `${data.rainProb}%`, iconName: "Umbrella", color: "text-blue-500" },
    { title: "الكمية", val: `${data.rainAmount}mm`, iconName: "CloudRain", color: "text-blue-600" },
    { title: "الشروق", val: data.sunrise || "-", iconName: "Sunrise", color: "text-orange-300" },
    { title: "الغروب", val: data.sunset || "-", iconName: "Sunset", color: "text-orange-500" },
    { title: "القمر", val: data.moonPhase || "-", iconName: "Moon", color: "text-indigo-200" },
    { title: "الثلوج", val: `${data.snowDepth || 0}cm`, iconName: "Snowflake", color: "text-white" },
    { title: "حرارة التربة", val: `${data.soilTemp || 0}°`, iconName: "Thermometer", color: "text-amber-600" },
    { title: "رطوبة التربة", val: `${data.soilMoisture || 0}`, iconName: "Droplets", color: "text-amber-700" },
  ];

  const currentList = activeTab === 'lifestyle' ? lifestyleList : technicalList;

  return (
    <div className="mt-12">
      <div className="flex justify-center mb-8 bg-white/5 p-1 rounded-full w-fit mx-auto border border-white/10">
        <button onClick={() => setActiveTab('lifestyle')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'lifestyle' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>حياتي وصحتي</button>
        <button onClick={() => setActiveTab('technical')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'technical' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>الأرصاد التقنية</button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in zoom-in duration-500">
        {currentList.map((item, i) => {
          const IconComponent = iconMap[item.iconName] || HelpCircle;
          return (
            <div key={i} className="group bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 hover:border-white/20 transition-all cursor-default min-h-[110px]">
              <IconComponent className={`w-6 h-6 mb-3 ${item.color || 'text-white'} group-hover:scale-110 transition-transform`} />
              <span className="text-[10px] text-white/50 font-medium mb-1 truncate w-full">{item.title}</span>
              <span className="text-sm font-bold text-white tracking-wide truncate w-full">{item.val}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
};