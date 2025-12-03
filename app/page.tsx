// app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  CloudSun, CloudRain, Sun, Moon, Wind, Droplets, Navigation, Search, Loader2, MapPin, Edit2, Check, BookOpen,
  Shirt, Car, HeartPulse, Coffee, Umbrella, Thermometer, Eye, Battery, Zap, Anchor, Tent, Flower2, AlertTriangle, Snowflake,
  Activity, Fish, Flame, Smile, Telescope, Bug, Volume2, StopCircle, Radio, X, Megaphone, ThumbsUp,
  Rocket, Microscope, Globe, ExternalLink, Info, Brain, BarChart3, ArrowDown, Clock, ArrowRight,
  Home as HomeIcon, Sunrise, Sunset, Shield, FileText, Server, Database
} from 'lucide-react';

import { getWeather, searchCities, getLocationByIP, getCityNameFromCoords } from './core/weather/api';
import { WeatherData, CityResult } from './core/weather/types';
import { getGlobalHazards, Hazard } from './hazards';
import { supabase } from './lib/supabaseClient';
import LivingScene from './components/LivingScene';

const Palmtree = Flower2;

// --- المكونات (مدمجة لضمان العمل) ---

const AccuracyBadge = ({ score }: { score: number }) => (
  <div className="absolute -top-6 right-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20 z-20 animate-pulse-slow">
    <Check className="w-3 h-3" /> دقة {score}%
  </div>
);

const AppFooter = () => {
  const [showLegal, setShowLegal] = useState(false);
  return (
    <footer className="mt-12 pb-8 text-center relative z-10">
      <div className="flex justify-center gap-6 text-white/60 text-xs mb-4">
        <button className="hover:text-white flex items-center gap-1"><Server className="w-3 h-3"/> حالة النظام: ممتاز</button>
        <button onClick={() => setShowLegal(!showLegal)} className="hover:text-white flex items-center gap-1"><FileText className="w-3 h-3"/> الشروط</button>
      </div>
      {showLegal && <div className="text-[10px] text-white/40 p-4 bg-black/20 rounded-xl mx-4">جميع الحقوق محفوظة © 2025. البيانات من Open-Meteo.</div>}
      <p className="text-white/30 text-[10px]">© 2025 السماء الواعية 2.0</p>
    </footer>
  );
};

const NewsModal = ({ hazard, onClose }: { hazard: Hazard, onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
      <div className="p-4 bg-slate-800 text-white flex justify-between items-center"><h3 className="font-bold flex gap-2"><Activity className="w-4 h-4"/> التفاصيل</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
      <div className="p-6"><h2 className="text-xl font-bold mb-2">{hazard.title}</h2><p className="text-slate-600 text-sm leading-relaxed">{hazard.details}</p></div>
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
    const u = new SpeechSynthesisUtterance("موجز.. " + hazards.map(h => h.title).join(". "));
    u.lang = 'ar-SA'; u.rate = 0.9; u.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(u);
  };

  const isCritical = hazards.some(h => h.severity === 'critical');
  const bgStyle = isCritical ? "bg-gradient-to-r from-red-600 to-red-700 text-white animate-pulse-slow" : "bg-slate-900 text-slate-200";

  return (
    <>
      {selectedNews && <NewsModal hazard={selectedNews} onClose={() => setSelectedNews(null)} />}
      <div className={`${bgStyle} border-b border-white/10 p-2 relative shadow-xl z-[60] transition-colors duration-1000 overflow-hidden`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button onClick={speakNews} className="p-1.5 rounded-full shrink-0 bg-white/10 hover:bg-white/20 text-white">{isPlaying ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
          <div className="flex-1 overflow-hidden flex items-center relative h-6">
             <div className="flex gap-12 animate-marquee whitespace-nowrap items-center pr-4">
              {hazards.map((h) => (
                <button key={h.id} onClick={() => setSelectedNews(h)} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded text-white"><Activity className="w-3 h-3" /> <span className="text-xs font-medium">{h.title}</span></button>
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
    const f = async () => { try { const { count: c } = await supabase.from('weather_reports').select('*', { count: 'exact', head: true }).eq('city', city).gte('created_at', new Date(Date.now() - 21600000).toISOString()); if (c !== null) setCount(c); } catch (e) {} };
    f();
    const sub = supabase.channel('room1').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'weather_reports', filter: `city=eq.${city}` }, () => setCount(c => c + 1)).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [city]);
  const h = async (t: string) => { setVoted(true); setIsOpen(false); try { await supabase.from('weather_reports').insert([{ city, condition: t }]); } catch (e) {} };
  if (voted) return <div className="fixed bottom-24 left-4 z-[100] bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-bottom"><ThumbsUp className="w-4 h-4 inline mr-2"/>تم الإبلاغ: {count}</div>;
  return (<> <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 left-4 z-[100] bg-indigo-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2"><Megaphone className="w-6 h-6" />{count > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}</button>{isOpen && (<div className="fixed bottom-40 left-4 z-[100] bg-white rounded-2xl shadow-2xl p-4 w-64 animate-in zoom-in-95"><div className="flex justify-between mb-3"><h3 className="font-bold text-slate-800 text-sm">حالة الطقس؟</h3><button onClick={() => setIsOpen(false)} className="text-xs text-slate-400">إغلاق</button></div><div className="grid grid-cols-2 gap-2">{['مشمس', 'غائم', 'ممطر', 'عاصف'].map(t => (<button key={t} onClick={() => h(t)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-xs font-bold">{t}</button>))}</div></div>)}</>);
};

const getLifestyleInsights = (data: WeatherData) => {
  const i = [];
  const migraine = data.pressure < 1005 ? "مرتفع" : "منخفض";
  i.push({ cat: "الصحة", title: "الصداع النصفي", val: migraine, reason: "تذبذب الضغط يؤثر.", icon: HeartPulse, color: "text-red-500" });
  const laundry = data.humidity < 60 ? "ممتاز" : "صعب";
  i.push({ cat: "المنزل", title: "نشر الغسيل", val: laundry, reason: "الرطوبة.", icon: Shirt, color: "text-blue-500" });
  const plants = data.soilMoisture < 0.2 ? "عطشى" : "مكتفية";
  i.push({ cat: "المنزل", title: "سقي النباتات", val: plants, reason: "رطوبة التربة.", icon: Palmtree, color: "text-orange-500" });
  const carWash = data.rainProb > 30 ? "أجّله" : "مناسب";
  i.push({ cat: "السيارة", title: "غسيل السيارة", val: carWash, reason: "احتمال المطر.", icon: Car, color: "text-indigo-500" });
  const mosquito = data.temp > 20 ? "نشط" : "خامل";
  i.push({ cat: "البيئة", title: "البعوض", val: mosquito, reason: "الحرارة.", icon: Bug, color: "text-red-600" });
  const stars = data.cloudCover < 10 ? "رصد مذهل" : "محجوب";
  i.push({ cat: "البيئة", title: "رصد النجوم", val: stars, reason: "الغيوم.", icon: Telescope, color: "text-purple-500" });
  return i;
};

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
  if (rainHours.length > 0) report += `🌧️ أمطار متوقعة الساعة ${rainHours[0]}:00. `; else report += `☀️ أجواء مستقرة وصافية. `;
  if (data.uvIndex > 7) report += `⚠️ UV مرتفع. `;
  return report;
};

const InfoCard = ({ item }: { item: any }) => {
  const [showReason, setShowReason] = useState(false);
  return (
    <div onClick={() => setShowReason(!showReason)} className={`relative p-3 rounded-xl border ${item.color?.replace('text', 'border').replace('500', '100') || 'border-slate-100'} bg-white/70 backdrop-blur-md flex flex-col items-center text-center shadow-sm hover:scale-105 transition-all duration-300 h-full justify-center cursor-pointer group ${showReason ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Info className="w-3 h-3 text-slate-400" /></div>
      <item.icon className={`w-6 h-6 mb-2 ${item.color || 'text-slate-500'}`} />
      <span className="text-[10px] text-slate-400 font-bold mb-1">{item.title}</span>
      <span className="text-sm font-bold text-slate-800 leading-tight">{item.val}</span>
      {showReason && <div className="absolute inset-0 bg-white/95 rounded-xl p-2 flex items-center justify-center text-center text-xs text-slate-600 font-medium z-10">{item.reason}</div>}
    </div>
  );
};

const HourlyForecast = ({ data }: { data: WeatherData }) => {
  if (!data.hourly || !data.hourly.time) return null;
  return (
    <div className="mb-8 animate-in slide-in-from-bottom duration-700">
      <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm opacity-90"><Clock className="w-4 h-4" /> الساعات القادمة</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
        {data.hourly.time.map((t, i) => {
          const date = new Date(t);
          const temp = data.hourly.temp?.[i] || 0;
          const rain = data.hourly.rain?.[i] || 0;
          const Icon = rain > 30 ? CloudRain : Sun;
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

const EditableLocation = ({ city, onSave }: { city: string, onSave: (n: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(city);
  useEffect(() => { setTempName(city); }, [city]);
  if (isEditing) return <div className="flex items-center gap-2 bg-black/20 backdrop-blur rounded-full px-2 py-1"><input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} className="bg-transparent text-white font-bold text-sm w-32 text-center outline-none" /><button onClick={() => { setIsEditing(false); onSave(tempName); }} className="text-green-400"><Check className="w-4 h-4" /></button></div>;
  return <div onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-white font-bold bg-black/20 px-4 py-1 rounded-full backdrop-blur cursor-pointer hover:bg-black/30 transition-colors"><MapPin className="w-4 h-4" /> {city} <Edit2 className="w-3 h-3 opacity-50" /></div>;
};

const WeatherHero = ({ data, onCityRename }: { data: WeatherData, onCityRename: (n: string) => void }) => {
  const insights = getLifestyleInsights(data);
  const bulletin = generateProBulletin(data);

  return (
    <div className="relative z-10">
      <div className="text-center text-white py-10 animate-in zoom-in duration-700">
        <div className="inline-flex justify-center mb-4"><EditableLocation city={data.city} onSave={onCityRename} /></div>
        <div className="inline-block relative">
          <AccuracyBadge score={94} />
          <h1 className="text-9xl font-thin tracking-tighter drop-shadow-2xl">{data.temp}°</h1>
        </div>
        <p className="text-2xl font-medium opacity-90">{data.description} • المحسوسة {data.feelsLike}°</p>
        <div className="flex justify-center gap-6 mt-4 opacity-80 text-sm font-bold"><span>💧 {data.humidity}%</span><span>💨 {data.windSpeed} كم/س</span></div>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 mb-8 shadow-xl">
        <h2 className="font-bold text-white text-sm mb-2 flex gap-2"><Radio className="w-4 h-4 animate-pulse text-red-400"/> النشرة الذكية</h2>
        <p className="text-white/90 leading-relaxed">{bulletin}</p>
      </div>

      <HourlyForecast data={data} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <InfoCard item={{ icon: Sunrise, title: "الشروق", value: data.sunrise, color: "text-amber-500" }} />
        <InfoCard item={{ icon: Sunset, title: "الغروب", value: data.sunset, color: "text-orange-500" }} />
        <InfoCard item={{ icon: Sun, title: "UV", value: data.uvIndex, color: "text-purple-500" }} />
        <InfoCard item={{ icon: Eye, title: "الرؤية", value: `${Math.round(data.visibility / 1000)} كم`, color: "text-emerald-500" }} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {insights.map((item, i) => <InfoCard key={i} item={item} />)}
      </div>
    </div>
  );
};

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleRename = (newName: string) => { if (weather) setWeather({ ...weather, city: newName }); };

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
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
        () => getLocationByIP().then(ip => { if (ip) fetchWeather(ip.lat, ip.lon, ip.city); }),
        { enableHighAccuracy: true }
      );
    } else { getLocationByIP().then(ip => { if (ip) fetchWeather(ip.lat, ip.lon, ip.city); }); }
  }, [fetchWeather]);

  useEffect(() => {
    const t = setTimeout(async () => { if (searchQuery.length > 2) setSearchResults(await searchCities(searchQuery)); }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  if (loading && !weather) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  if (!weather) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">تعذر جلب البيانات</div>;

  return (
    <main className="min-h-screen relative font-sans overflow-x-hidden pb-20">
      <LivingScene data={weather} />
      <HazardTicker />
      <HiveMindButton city={weather.city} />
      
      <div className="p-4 md:p-6 max-w-lg mx-auto relative z-10">
        <div className="flex justify-between items-center mb-12 mt-4 text-white">
          <div className="font-bold flex items-center gap-2">السماء الواعية</div>
          <div className="relative">
             {showSearch ? (
               <input autoFocus type="text" placeholder="بحث..." className="bg-white/90 rounded-full px-4 py-1 text-sm text-slate-800 outline-none w-40 shadow-lg" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onBlur={() => setTimeout(() => setShowSearch(false), 200)} />
             ) : (
               <button onClick={() => setShowSearch(true)} className="p-2 bg-white/20 rounded-full text-white backdrop-blur hover:bg-white/30"><Search className="w-5 h-5" /></button>
             )}
             {searchResults.length > 0 && (
               <div className="absolute top-10 right-0 w-64 bg-white rounded-xl shadow-xl border overflow-hidden py-2 z-50 text-black">
                 {searchResults.map((c) => (
                   <button key={c.id} onClick={() => fetchWeather(c.latitude, c.longitude, c.name)} className="w-full text-right px-4 py-2 hover:bg-slate-100 text-sm">{c.name}</button>
                 ))}
               </div>
             )}
          </div>
        </div>
        
        <WeatherHero data={weather} onCityRename={handleRename} />
        
        {/* زر الرادار فقط (بدون الخريطة المكررة) */}
        <Link href="/radar">
          <div className="mt-8 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur rounded-3xl p-6 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-2xl border border-white/20 group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full group-hover:rotate-12 transition-transform"><MapPin className="w-8 h-8 text-white" /></div>
              <div><h3 className="text-white font-bold text-xl">غرفة الرادار</h3><p className="text-blue-100 text-sm">الخرائط والتحليل</p></div>
            </div>
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
        </Link>

        <AppFooter />
      </div>
    </main>
  );
}
