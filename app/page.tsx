// app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link'; // إضافة Link المفقود

// 1. استيراد الأيقونات (مع إعادة تسمية Home لتجنب التعارض)
import { 
  CloudSun, CloudRain, Sun, Moon, Wind, Droplets, Navigation, Search, Loader2, MapPin, Edit2, Check, BookOpen,
  Shirt, Car, HeartPulse, Coffee, Umbrella, Thermometer, Eye, Battery, Zap, Anchor, Tent, Flower2, AlertTriangle, Snowflake,
  Activity, Fish, Flame, Smile, Telescope, Bug, Volume2, StopCircle, Radio, X, Megaphone, ThumbsUp,
  Rocket, Microscope, Globe, ExternalLink, Info, Brain, BarChart3, ArrowDown, Clock, ArrowRight,
  Home as HomeIcon // <-- الحل السحري: سميناها HomeIcon هنا
} from 'lucide-react';

// 2. استيراد الدوال والأنواع (منفصلة وصحيحة)
import { getWeather, searchCities, getLocationByIP, getCityNameFromCoords } from './core/weather/api';
import { WeatherData, CityResult } from './core/weather/types'; // <-- المصدر الصحيح للأنواع
import { getGlobalHazards, Hazard } from './hazards';
import { supabase } from './lib/supabaseClient';
import LivingScene from './components/LivingScene';
import { analyzeWeatherModels, AnalysisResult } from './analysis';

// تعريف Palmtree يدوياً إذا لم تكن موجودة
const Palmtree = Flower2;

const WeatherMap = dynamic(() => import('./Map'), { 
  ssr: false, 
  loading: () => <div className="h-[400px] bg-slate-900/50 animate-pulse rounded-3xl flex items-center justify-center text-slate-400">جاري تحميل الرادار...</div> 
});

// --- المكونات المساعدة ---

const NewsModal = ({ hazard, onClose }: { hazard: Hazard, onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className={`p-4 ${hazard.severity === 'critical' ? 'bg-red-500' : 'bg-slate-800'} text-white flex justify-between items-center`}>
        <h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4" /> التفاصيل</h3>
        <button onClick={onClose}><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{hazard.title}</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <span className="bg-slate-100 px-2 py-1 rounded">{hazard.source}</span>
          <span>{hazard.date}</span>
        </div>
        <p className="text-slate-600 leading-relaxed mb-6">{hazard.details}</p>
        {hazard.url && <a href={hazard.url} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-700 transition-colors"><ExternalLink className="w-4 h-4" /> اقرأ المصدر الكامل</a>}
      </div>
    </div>
  </div>
);

const HazardTicker = () => {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [visible, setVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNews, setSelectedNews] = useState<Hazard | null>(null);

  useEffect(() => { getGlobalHazards().then(setHazards); }, []);
  useEffect(() => { if (typeof window !== 'undefined') window.speechSynthesis.getVoices(); }, []);

  if (!visible || hazards.length === 0) return null;

  const speakNews = () => {
    if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); return; }
    setIsPlaying(true);
    const textToRead = "إليك موجز أحوال الكوكب.. " + hazards.map(h => h.title).join(". .. ");
    const u = new SpeechSynthesisUtterance(textToRead);
    u.lang = 'ar-SA'; u.rate = 0.9; u.onend = () => setIsPlaying(false);
    const v = window.speechSynthesis.getVoices().find(x => x.lang.includes('ar'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };

  const isCritical = hazards.some(h => h.severity === 'critical');
  const bgStyle = isCritical ? "bg-gradient-to-r from-red-600 to-red-700 text-white animate-pulse-slow" : "bg-slate-900 text-slate-200";
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'earthquake': return <Activity className="w-4 h-4 text-red-400" />;
      case 'space': return <Rocket className="w-4 h-4 text-purple-400" />;
      case 'science': return <Microscope className="w-4 h-4 text-cyan-400" />;
      default: return <Globe className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <>
      {selectedNews && <NewsModal hazard={selectedNews} onClose={() => setSelectedNews(null)} />}
      <div className={`${bgStyle} border-b border-white/10 p-2 relative shadow-xl z-[60] transition-colors duration-1000 overflow-hidden`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button onClick={speakNews} className={`p-1.5 rounded-full shrink-0 ${isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
            {isPlaying ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex-1 overflow-hidden flex items-center relative h-6">
             <div className="flex gap-12 animate-marquee whitespace-nowrap items-center pr-28">
              {hazards.map((h) => (
                <button key={h.id} onClick={() => setSelectedNews(h)} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded text-white">
                  {getIcon(h.type)}<span className="text-xs font-medium underline decoration-dotted underline-offset-4">{h.title}</span>
                </button>
              ))}
             </div>
          </div>
          <button onClick={() => setVisible(false)} className="text-white/50 hover:text-white p-1 shrink-0 ml-2"><X className="w-4 h-4" /></button>
        </div>
      </div>
    </>
  );
};

const HiveMindButton = ({ city }: { city: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voted, setVoted] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const f = async () => { try { const { count: c } = await supabase.from('weather_reports').select('*', { count: 'exact', head: true }).eq('city', city).gte('created_at', new Date(Date.now() - 3600000).toISOString()); if (c !== null) setCount(c); } catch (e) {} };
    f();
    const sub = supabase.channel('room1').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'weather_reports', filter: `city=eq.${city}` }, () => setCount(c => c + 1)).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [city]);
  const h = async (t: string) => { setVoted(true); setIsOpen(false); try { await supabase.from('weather_reports').insert([{ city, condition: t }]); } catch (e) {} };
  if (voted) return <div className="fixed bottom-24 left-4 z-[100] bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-bottom"><ThumbsUp className="w-4 h-4 inline mr-2"/>شكراً!</div>;
  return (<> <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 left-4 z-[100] bg-indigo-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2"><Megaphone className="w-6 h-6" />{count > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}</button>{isOpen && (<div className="fixed bottom-40 left-4 z-[100] bg-white rounded-2xl shadow-2xl p-4 w-64 animate-in zoom-in-95"><div className="flex justify-between mb-3"><h3 className="font-bold text-slate-800 text-sm">حالة الطقس؟</h3><button onClick={() => setIsOpen(false)} className="text-xs text-slate-400">إغلاق</button></div><div className="grid grid-cols-2 gap-2">{['مشمس', 'غائم', 'ممطر', 'عاصف'].map(t => (<button key={t} onClick={() => h(t)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-xs font-bold">{t}</button>))}</div></div>)}</>);
};

const AnalysisRoom = ({ lat, lon }: { lat: number, lon: number }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { analyzeWeatherModels(lat, lon).then(setAnalysis); }, [lat, lon]);
  if (!analysis) return <div className="mt-6 p-6 text-center text-slate-400 text-xs bg-white/50 rounded-2xl border border-slate-100">جاري التحليل...</div>;
  return (
    <div className="mt-6 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-700">
      <div className="bg-slate-900 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white"><Brain className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-sm">الذكاء التحليلي</h3></div>
        <span className={`font-black text-lg ${analysis.consensusScore > 80 ? 'text-green-400' : 'text-red-400'}`}>{Math.round(analysis.consensusScore)}%</span>
      </div>
      {analysis.selfIssuedAlert && (<div className="bg-red-50 p-3 border-b border-red-100 flex gap-3 items-start"><AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /><p className="text-red-600 text-[10px]">{analysis.selfIssuedAlert}</p></div>)}
      <div className="p-4">
        <div className="overflow-x-auto"><table className="w-full text-xs text-right whitespace-nowrap"><thead><tr className="text-slate-400 border-b"><th className="pb-2">النموذج</th><th className="pb-2">الحرارة</th><th className="pb-2">المطر</th></tr></thead><tbody className="text-slate-600">{(showAll ? analysis.allModels : analysis.allModels.slice(0, 4)).map((m, i) => (<tr key={i} className="border-b border-slate-50"><td className="py-2">{m.country} {m.name}</td><td className="py-2">{m.temp.toFixed(1)}°</td><td className="py-2">{m.rain > 0 ? `${m.rain.toFixed(1)}` : '-'}</td></tr>))}</tbody></table></div>
        <button onClick={() => setShowAll(!showAll)} className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-slate-400 py-2 border-t border-slate-50">{showAll ? "إخفاء" : "عرض المزيد"} <ArrowDown className={`w-3 h-3 ${showAll ? 'rotate-180' : ''}`} /></button>
      </div>
    </div>
  );
};

const InfoCard = ({ item }: { item: any }) => {
  const [showReason, setShowReason] = useState(false);
  return (
    <div onClick={() => setShowReason(!showReason)} className={`relative p-3 rounded-xl border ${item.color?.replace('text', 'border').replace('500', '100') || 'border-slate-100'} bg-white/70 backdrop-blur-md flex flex-col items-center text-center shadow-sm hover:scale-105 transition-all duration-300 h-full justify-center cursor-pointer group ${showReason ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Info className="w-3 h-3 text-slate-400" /></div>
      <item.icon className={`w-6 h-6 mb-2 ${item.color || 'text-slate-500'}`} />
      <span className="text-[10px] text-slate-400 font-bold mb-1">{item.title}</span>
      <span className="text-sm font-bold text-slate-800">{item.val}</span>
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

// --- خوارزميات الحياة (تصحيح الأنواع) ---
const getSafeValue = (array: number[] | undefined, index: number, fallback: number = 0): number => {
  if (!array || !Array.isArray(array) || index >= array.length) return fallback;
  return array[index];
};

const generateProBulletin = (data: WeatherData): string => {
  const hourly = data.hourly;
  if (!hourly) return "جاري تحليل البيانات...";
  let maxTemp = -100, minTemp = 100;
  let rainHours: number[] = [];
  
  if (hourly.time) {
    hourly.time.forEach((t: string, i: number) => { // تصحيح نوع t و i
      const temp = getSafeValue(hourly.temp, i);
      const rain = getSafeValue(hourly.rain, i);
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

const getLifestyleInsights = (data: WeatherData) => {
  return [
    { title: "خطر الصداع", value: data.pressure < 1005 ? "مرتفع" : "منخفض", reason: "ضغط منخفض.", icon: HeartPulse, color: "text-red-500" },
    { title: "نشر الغسيل", value: data.humidity < 60 ? "ممتاز" : "صعب", reason: "الرطوبة.", icon: Shirt, color: "text-blue-500" },
    { title: "سقي النباتات", value: data.soilMoisture < 0.3 ? "اسقِ الآن" : "رطبة", reason: "رطوبة التربة.", icon: Palmtree, color: "text-green-600" },
    { title: "غسيل السيارة", value: data.rainProb > 30 ? "أجّله" : "مناسب", reason: "احتمال المطر.", icon: Car, color: "text-indigo-500" },
    { title: "البعوض", value: data.temp > 20 ? "نشط" : "خامل", reason: "الحرارة.", icon: Bug, color: "text-orange-600" },
    { title: "النشاط المنزلي", value: data.uvIndex > 7 ? "ابقَ بالداخل" : "اخرج", reason: "حسب UV.", icon: HomeIcon, color: "text-rose-500" },
  ];
};

const HourlyForecast = ({ data }: { data: WeatherData }) => {
  if (!data.hourly || !data.hourly.time) return null;
  return (
    <div className="mb-8">
      <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-90"><Clock className="w-4 h-4" /> الساعات القادمة</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
        {data.hourly.time.map((t: string, i: number) => {
          const date = new Date(t);
          const temp = getSafeValue(data.hourly.temp, i);
          const rain = getSafeValue(data.hourly.rain, i);
          const uv = getSafeValue(data.hourly.uvIndex, i);
          const Icon = rain > 30 ? CloudRain : (uv > 0 ? Sun : Moon);
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

const WeatherHero = ({ data, onCityRename }: { data: WeatherData, onCityRename: (n: string) => void }) => {
  const insights = getLifestyleInsights(data);
  const bulletin = generateProBulletin(data);

  return (
    <div className="relative z-10">
      <div className="text-center text-white py-10 animate-in zoom-in duration-700">
        <div className="inline-flex justify-center mb-4"><EditableLocation city={data.city} onSave={onCityRename} /></div>
        <h1 className="text-9xl font-thin tracking-tighter drop-shadow-2xl">{data.temp}°</h1>
        <p className="text-2xl font-medium opacity-90">{data.description} • المحسوسة {data.feelsLike}°</p>
        <div className="flex justify-center gap-6 mt-4 opacity-80 text-sm font-bold">
          <span>💧 {data.humidity}%</span><span>💨 {data.windSpeed} كم/س</span>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8 shadow-xl">
        <h2 className="font-bold text-white text-sm mb-2 flex gap-2"><Radio className="w-4 h-4 animate-pulse text-red-400"/> النشرة الذكية</h2>
        <p className="text-white/90 leading-relaxed">{bulletin}</p>
      </div>

      <HourlyForecast data={data} />

      <div className="mt-8 grid grid-cols-2 gap-3">
        {insights.map((item, i) => <InfoCard key={i} item={item} />)}
      </div>
    </div>
  );
};

// --- التطبيق الرئيسي ---
export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [coords, setCoords] = useState({ lat: 33.5731, lon: -7.5898 });

  const handleRename = (newName: string) => { if (weather) setWeather({ ...weather, city: newName }); };

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true); setCoords({ lat, lon });
    const data = await getWeather(lat, lon, name);
    setWeather(data); setLoading(false); setShowSearch(false);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const name = await getCityNameFromCoords(pos.coords.latitude, pos.coords.longitude);
          fetchWeather(pos.coords.latitude, pos.coords.longitude, name);
        },
        async () => { const ip = await getLocationByIP(); if (ip) fetchWeather(ip.lat, ip.lon, ip.city); },
        { enableHighAccuracy: true }
      );
    } else { getLocationByIP().then(ip => { if (ip) fetchWeather(ip.lat, ip.lon, ip.city); }); }
  }, [fetchWeather]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
      } else { setSearchResults([]); }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading && !weather) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  if (!weather) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">تعذر جلب البيانات</div>;

  return (
    <main className="min-h-screen relative font-sans overflow-x-hidden pb-20">
      <LivingScene data={weather} />
      <HazardTicker />
      <HiveMindButton city={weather.city} />
      
      <div className="p-4 md:p-6 max-w-lg mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8 mt-4 text-white">
          <div className="font-bold flex items-center gap-2">السماء الواعية</div>
          <div className="relative">
             {showSearch ? (
               <input autoFocus type="text" placeholder="بحث..." className="bg-white/20 backdrop-blur rounded-full px-4 py-1 text-sm text-slate-800 outline-none w-40 shadow-lg" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onBlur={() => setTimeout(() => setShowSearch(false), 200)} />
             ) : (
               <button onClick={() => setShowSearch(true)} className="p-2 bg-white/20 rounded-full text-white backdrop-blur hover:bg-white/30"><Search className="w-5 h-5" /></button>
             )}
             {searchResults.length > 0 && (
               <div className="absolute top-10 right-0 w-64 bg-white rounded-xl shadow-xl border overflow-hidden py-2 z-50 text-black">
                 {searchResults.map((c) => (
                   <button key={c.id} onClick={() => fetchWeather(c.latitude, c.longitude, c.name)} className="w-full text-right px-4 py-2 hover:bg-slate-100 text-sm text-slate-800">{c.name}</button>
                 ))}
               </div>
             )}
          </div>
        </div>

        <WeatherHero data={weather} onCityRename={handleRename} />
        
        {/* غرفة التحليل (مدمجة) */}
        <AnalysisRoom lat={coords.lat} lon={coords.lon} />
        
        <div className="mt-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> خريطة الرصد</h2>
          <WeatherMap lat={coords.lat} lon={coords.lon} city={weather.city} />
        </div>
      </div>
    </main>
  );
}
