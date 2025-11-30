'use client';
import React, { useState } from 'react';
import { CloudSun, CloudRain, Sun, Moon, Wind, Droplets, Navigation, Info, Clock, Check, MapPin, Edit2, Radio } from 'lucide-react';
import { WeatherData } from '../core/weather/types';
import { generateInsights } from '../core/analysis/insights';

// --- الدوال المساعدة داخل المكون ---
const InfoCard = ({ item }: { item: any }) => {
  const [showReason, setShowReason] = useState(false);
  return (
    <div onClick={() => setShowReason(!showReason)} className={`relative p-3 rounded-xl border ${item.color?.replace('text', 'border').replace('500', '100') || 'border-slate-100'} bg-white/70 backdrop-blur-md flex flex-col items-center text-center shadow-sm hover:scale-105 transition-all duration-300 h-full justify-center cursor-pointer group ${showReason ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Info className="w-3 h-3 text-slate-400" /></div>
      <item.icon className={`w-6 h-6 mb-2 ${item.color || 'text-slate-500'}`} />
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{item.title}</span>
      <span className="text-sm font-bold text-slate-800 leading-tight">{item.value}</span>
      {showReason && <div className="absolute inset-0 bg-white/95 rounded-xl p-2 flex items-center justify-center text-center animate-in zoom-in duration-200 z-10"><p className="text-xs text-slate-600 font-medium leading-tight">{item.reason}</p></div>}
    </div>
  );
};

const InsightTab = ({ category, items }: { category: string, items: any[] }) => (
  <div className="mb-6 animate-in slide-in-from-bottom duration-700">
    <h3 className="text-white/90 font-bold text-sm mb-3 px-2 border-r-4 border-white/50">{category}</h3>
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, idx) => <InfoCard key={idx} item={item} />)}
    </div>
  </div>
);

const EditableLocation = ({ city, onSave }: { city: string, onSave: (n: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(city);
  if (isEditing) return <div className="flex items-center gap-2 bg-black/20 backdrop-blur rounded-full px-2 py-1"><input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} className="bg-transparent text-white font-bold text-sm w-32 text-center outline-none" /><button onClick={() => { setIsEditing(false); onSave(tempName); }} className="text-green-400"><Check className="w-4 h-4" /></button></div>;
  return <div onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-white font-bold bg-black/20 px-4 py-1 rounded-full backdrop-blur cursor-pointer hover:bg-black/30 transition-colors"><MapPin className="w-4 h-4" /> {city} <Edit2 className="w-3 h-3 opacity-50" /></div>;
};

// --- النشرة الذكية ---
const generateProBulletin = (data: WeatherData): string => {
  const hourly = data.hourly;
  if (!hourly) return "جاري تحليل البيانات...";
  let maxTemp = -100, minTemp = 100;
  let rainHours: number[] = [];
  
  if (hourly.time) {
    hourly.time.forEach((t, i) => {
      const temp = hourly.temp?.[i] || 0;
      const rain = hourly.rain?.[i] || 0;
      const hour = new Date(t).getHours();
      if (temp > maxTemp) maxTemp = temp;
      if (temp < minTemp) minTemp = temp;
      if (rain > 20) rainHours.push(hour);
    });
  }
  let report = `الحرارة اليوم بين ${Math.round(minTemp)}° و ${Math.round(maxTemp)}°. `;
  if (rainHours.length > 0) report += `🌧️ أمطار متوقعة الساعة ${rainHours[0]}:00. `; else report += `☀️ أجواء مستقرة. `;
  if (data.uvIndex > 7) report += `⚠️ UV مرتفع.`;
  return report;
};

export default function WeatherHero({ data, onCityRename }: { data: WeatherData, onCityRename: (n: string) => void }) {
  const allInsights = generateInsights(data);
  const bulletin = generateProBulletin(data);
  const categories = ["الصحة", "المنزل", "النشاط", "البيئة", "الجمال", "السيارة"];

  return (
    <div className="relative z-10">
      {/* الرأس الكبير */}
      <div className="text-center text-white py-10 animate-in zoom-in duration-700">
        <div className="inline-flex justify-center mb-4"><EditableLocation city={data.city} onSave={onCityRename} /></div>
        <h1 className="text-9xl font-thin tracking-tighter drop-shadow-2xl">{data.temp}°</h1>
        <p className="text-2xl font-medium opacity-90">{data.description} • المحسوسة {data.feelsLike}°</p>
        <div className="flex justify-center gap-6 mt-4 opacity-80 text-sm font-bold">
          <span>💧 {data.humidity}%</span><span>💨 {data.windSpeed} كم/س</span>
        </div>
      </div>

      {/* النشرة */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8 shadow-xl">
        <h2 className="font-bold text-white text-sm mb-2 flex gap-2"><Radio className="w-4 h-4 animate-pulse text-red-400"/> النشرة الذكية</h2>
        <p className="text-white/90 leading-relaxed">{bulletin}</p>
      </div>

      {/* الشريط الساعي */}
      {data.hourly && (
        <div className="mb-8">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-90"><Clock className="w-4 h-4" /> الساعات القادمة</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
            {data.hourly.time.map((t, i) => {
              const date = new Date(t);
              const code = data.hourly.weatherCode?.[i] || 0;
              const temp = data.hourly.temp?.[i] || 0;
              const Icon = code > 60 ? CloudRain : (code < 3 ? Sun : CloudSun);
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
      )}

      {/* لوحة القيادة الشاملة */}
      <div className="bg-white/30 backdrop-blur-xl rounded-t-3xl p-6 min-h-screen shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/20">
        <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto mb-8"></div>
        {categories.map(cat => {
          const catItems = allInsights.filter(i => i.cat === cat);
          if (catItems.length === 0) return null;
          return <InsightTab key={cat} category={cat} items={catItems} />;
        })}
      </div>
    </div>
  );
}
