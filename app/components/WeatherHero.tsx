'use client';
import React, { useState, useEffect } from 'react';
import { CloudSun, CloudRain, Sun, Moon, Wind, Droplets, Navigation, MapPin, Edit2, Check, HeartPulse, Shirt, Palmtree, Car, Bug, Telescope, Coffee, Clock, Info } from 'lucide-react';
import { WeatherData } from '../core/weather/types';
import { generateInsights } from '../core/analysis/insights';

const InfoCard = ({ item }: { item: any }) => {
  const [showReason, setShowReason] = useState(false);
  return (
    <div onClick={() => setShowReason(!showReason)} className={`relative p-3 rounded-xl border ${item.color?.replace('text', 'border').replace('500', '100') || 'border-slate-100'} bg-white/70 backdrop-blur-md flex flex-col items-center text-center shadow-sm cursor-pointer`}>
      <div className="absolute top-2 right-2 opacity-50"><Info className="w-3 h-3 text-slate-400" /></div>
      <item.icon className={`w-6 h-6 mb-2 ${item.color || 'text-slate-500'}`} />
      <span className="text-[10px] text-slate-400 font-bold mb-1">{item.title}</span>
      <span className="text-sm font-bold text-slate-800">{item.val || item.value}</span>
      {showReason && <div className="absolute inset-0 bg-white/95 rounded-xl p-2 flex items-center justify-center text-center text-xs text-slate-600 font-medium z-10">{item.reason}</div>}
    </div>
  );
};

const EditableLocation = ({ city, onSave }: { city: string, onSave: (n: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(city);
  useEffect(() => { setTempName(city); }, [city]);
  if (isEditing) return <div className="flex items-center gap-2 bg-black/20 backdrop-blur rounded-full px-2 py-1"><input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} className="bg-transparent text-white font-bold text-sm w-32 text-center outline-none" /><button onClick={() => { setIsEditing(false); onSave(tempName); }} className="text-green-400"><Check className="w-4 h-4" /></button></div>;
  return <div onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-white font-bold bg-black/20 px-4 py-1 rounded-full backdrop-blur cursor-pointer hover:bg-black/30 transition-colors"><MapPin className="w-4 h-4" /> {city} <Edit2 className="w-3 h-3 opacity-50" /></div>;
};

const HourlyForecast = ({ data }: { data: WeatherData }) => {
  if (!data.hourly || !data.hourly.time) return null;
  return (
    <div className="mb-8">
      <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-90"><Clock className="w-4 h-4" /> الساعات القادمة</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
        {data.hourly.time.map((t, i) => {
          const date = new Date(t);
          const temp = data.hourly.temp?.[i] || 0;
          const Icon = data.hourly.rain?.[i] > 30 ? CloudRain : (data.hourly.uvIndex?.[i] > 0 ? Sun : Moon);
          return (
            <div key={i} className="min-w-[60px] flex flex-col items-center text-white bg-white/10 backdrop-blur rounded-xl p-2 border border-white/10">
              <span className="text-xs opacity-80 mb-1">{date.getHours()}:00</span>
              <Icon className="w-5 h-5 mb-1 opacity-90" />
              <span className="font-bold text-sm">{Math.round(temp)}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function WeatherHero({ data, onCityRename }: { data: WeatherData, onCityRename: (n: string) => void }) {
  const insights = generateInsights(data);
  let bulletin = `الحرارة ${data.temp}°، ${data.description}. الرياح ${data.windSpeed} كم/س. ` + (data.rainProb > 30 ? "توقعات بأمطار." : "أجواء مستقرة.");

  return (
    <div className="relative z-10">
      <div className="text-center text-white py-10 animate-in zoom-in duration-700">
        <div className="inline-flex justify-center mb-4"><EditableLocation city={data.city} onSave={onCityRename} /></div>
        <h1 className="text-9xl font-thin tracking-tighter drop-shadow-2xl">{data.temp}°</h1>
        <p className="text-2xl font-medium opacity-90">{data.description} • المحسوسة {data.feelsLike}°</p>
        <div className="flex justify-center gap-6 mt-4 opacity-80 text-sm font-bold"><span>💧 {data.humidity}%</span><span>💨 {data.windSpeed} كم/س</span></div>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8 shadow-xl">
        <h2 className="font-bold text-white text-sm mb-2 opacity-80">النشرة الذكية</h2>
        <p className="text-white/90 leading-relaxed">{bulletin}</p>
      </div>

      <HourlyForecast data={data} />

      <div className="mt-8 grid grid-cols-2 gap-3">
        {insights.map((item, i) => <InfoCard key={i} item={item} />)}
      </div>
    </div>
  );
}
