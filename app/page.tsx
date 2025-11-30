// app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  CloudSun, Wind, Droplets, Navigation, Search, Loader2, MapPin, BookOpen, Edit2, Check, 
  Sunrise, Sunset, Sun, Eye, Shirt, Car, Home as HomeIcon, Palmtree, HeartPulse, Zap, Coffee, Camera, Tent,
  Fish, Bug, Megaphone, ThumbsUp, Activity, AlertTriangle, X, Volume2, StopCircle, Radio, Microscope, Globe, Rocket, ExternalLink, Info, Brain, BarChart3, ArrowDown
} from 'lucide-react';
import { getWeather, searchCities, getLocationByIP, getCityNameFromCoords, WeatherData, CityResult } from './weather';
import { getGlobalHazards, Hazard } from './hazards';
import { supabase } from './lib/supabaseClient';
import { analyzeWeatherModels, AnalysisResult } from './analysis';

// 1. استيراد الخريطة
const WeatherMap = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-slate-500">جاري تحميل الرادار...</div>
});

// 2. المكونات المساعدة

const NewsModal = ({ hazard, onClose }: { hazard: Hazard, onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className={`p-4 ${hazard.severity === 'critical' ? 'bg-red-500' : 'bg-slate-800'} text-white flex justify-between items-center`}>
        <h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4" /> تفاصيل الحدث</h3>
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
  
  useEffect(() => { 
    if (typeof window !== 'undefined') window.speechSynthesis.getVoices(); 
  }, []);

  if (!visible || hazards.length === 0) return null;

  const speakNews = () => {
    if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); return; }
    setIsPlaying(true);
    const textToRead = "موجز.. " + hazards.map(h => h.title).join(". ");
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
          <button onClick={speakNews} className={`p-1.5 rounded-full shrink-0 ${isPlaying ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>
            {isPlaying ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex-1 overflow-hidden flex items-center relative h-6">
             <div className="flex gap-12 animate-marquee whitespace-nowrap items-center pr-4">
              {hazards.map((h) => (
                <button key={h.id} onClick={() => setSelectedNews(h)} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded">
                  {getIcon(h.type)} <span className="text-xs font-medium">{h.title}</span>
                </button>
              ))}
             </div>
          </div>
          <button onClick={() => setVisible(false)}><X className="w-4 h-4 text-white/50" /></button>
        </div>
      </div>
    </>
  );
};

// --- المكون الذي سبب المشكلة (تم إصلاحه) ---
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
      
      {analysis.selfIssuedAlert && (
        <div className="bg-red-50 p-3 border-b border-red-100 flex gap-3 items-start"><AlertTriangle className="w-4 h-4 text-red-600 shrink-0" /><p className="text-red-600 text-[10px]">{analysis.selfIssuedAlert}</p></div>
      )}

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right whitespace-nowrap">
            <thead><tr className="text-slate-400 border-b"><th className="pb-2">النموذج</th><th className="pb-2">الحرارة</th><th className="pb-2">المطر</th><th className="pb-2">الرياح</th></tr></thead>
            <tbody className="text-slate-600">
              {(showAll ? analysis.allModels : analysis.allModels.slice(0, 4)).map((m, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2">{m.country} {m.name}</td>
                  {/* --- الإصلاح هنا: التأكد من وجود القيم قبل استخدام toFixed --- */}
                  <td className="py-2">{m.temp != null ? m.temp.toFixed(1) : '--'}°</td>
                  <td className="py-2">{m.rain != null && m.rain > 0 ? `${m.rain.toFixed(1)}` : '-'}</td>
                  <td className="py-2">{m.wind != null ? m.wind.toFixed(0) : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setShowAll(!showAll)} className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-slate-400 py-2 border-t border-slate-50">
          {showAll ? "إخفاء" : "عرض المزيد"} <ArrowDown className={`w-3 h-3 ${showAll ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};

// باقي المكونات (InfoCard, EditableLocation, HiveMindButton, WeatherHero, Home)
// ... (انسخها كما هي من الكود السابق - فهي سليمة) ...
// سأضعها هنا للإكمال:

const InfoCard = ({ item }: { item: any }) => {
  const [showReason, setShowReason] = useState(false);
  return (
    <div onClick={() => setShowReason(!showReason)} className={`relative p-3 rounded-xl border ${item.color?.replace('text', 'border').replace('500', '100') || 'border-slate-100'} bg-white/70 backdrop-blur-md flex flex-col items-center text-center shadow-sm cursor-pointer`}>
      <div className="absolute top-2 right-2 opacity-50"><Info className="w-3 h-3 text-slate-400" /></div>
      <item.icon className={`w-6 h-6 mb-2 ${item.color || 'text-slate-500'}`} />
      <span className="text-[10px] text-slate-400 font-bold mb-1">{item.title}</span>
      <span className="text-sm font-bold text-slate-800">{item.value}</span>
      {showReason && <div className="absolute inset-0 bg-white/95 rounded-xl p-2 flex items-center justify-center text-center text-xs text-slate-600 font-medium z-10">{item.reason}</div>}
    </div>
  );
};

const EditableLocation = ({ city, onSave }: { city: string, onSave: (newName: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(city);
  useEffect(() => { setTempName(city); }, [city]);
  const handleSave = () => { setIsEditing(false); onSave(tempName); };
  if (isEditing) return <div className="flex items-center gap-2 bg-white/50 rounded-full px-2 py-1 border border-blue-300"><input autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="bg-transparent outline-none text-blue-800 font-bold text-sm w-32 text-center" /><button onClick={handleSave} className="p-1 bg-green-500 text-white rounded-full"><Check className="w-3 h-3" /></button></div>;
  return <div className="group flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4 border border-blue-200 shadow-sm cursor-pointer" onClick={() => setIsEditing(true)}><MapPin className="w-4 h-4" /> <span>{city}</span> <Edit2 className="w-3 h-3 opacity-50" /></div>;
};

const HiveMindButton = ({ city }: { city: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voted, setVoted] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const f = async () => { try { const { count: c } = await supabase.from('weather_reports').select('*', { count: 'exact', head: true }).eq('city', city).gte('created_at', new Date(Date.now() - 21600000).toISOString()); if (c !== null) setCount(c); } catch (e) {} };
    f();
    const sub = supabase.channel('x').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'weather_reports', filter: `city=eq.${city}` }, () => setCount(c => c + 1)).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [city]);
  const h = async (t: string) => { setVoted(true); setIsOpen(false); try { await supabase.from('weather_reports').insert([{ city, condition: t }]); } catch (e) {} };
  if (voted) return <div className="fixed bottom-24 left-4 z-[100] bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-bottom"><ThumbsUp className="w-4 h-4 inline mr-2"/>تم الإبلاغ: {count}</div>;
  return (<> <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 left-4 z-[100] bg-indigo-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2"><Megaphone className="w-6 h-6" />{count > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{count}</span>}</button>{isOpen && (<div className="fixed bottom-40 left-4 z-[100] bg-white rounded-2xl shadow-2xl p-4 w-64 animate-in zoom-in-95"><div className="flex justify-between mb-3"><h3 className="font-bold text-slate-800 text-sm">حالة الطقس؟</h3><button onClick={() => setIsOpen(false)} className="text-xs text-slate-400">إغلاق</button></div><div className="grid grid-cols-2 gap-2">{['مشمس', 'غائم', 'ممطر', 'عاصف'].map(t => (<button key={t} onClick={() => h(t)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-xs font-bold">{t}</button>))}</div></div>)}</>);
};

const getLifestyleInsights = (data: WeatherData) => {
  return [
    { title: "خطر الصداع", value: data.pressure < 1005 ? "مرتفع" : "منخفض", reason: data.pressure < 1005 ? "انخفاض الضغط." : "الضغط مستقر.", icon: HeartPulse, color: data.pressure < 1005 ? "text-red-500" : "text-green-500" },
    { title: "نشر الغسيل", value: data.humidity < 60 ? "ممتاز" : "صعب", reason: data.humidity < 60 ? "جاف." : "رطب.", icon: Shirt, color: "text-blue-500" },
    { title: "سقي النباتات", value: data.soilMoisture < 0.3 ? "اسقِ الآن" : "رطبة", reason: "حسب رطوبة التربة.", icon: Palmtree, color: "text-green-600" },
    { title: "غسيل السيارة", value: data.rainProb > 30 ? "أجّله" : "مناسب", reason: "حسب احتمال المطر.", icon: Car, color: "text-indigo-500" },
    { title: "البعوض", value: data.temp > 20 ? "نشط" : "خامل", reason: "حسب الحرارة.", icon: Bug, color: "text-orange-600" },
    { title: "النشاط المنزلي", value: data.uvIndex > 7 ? "ابقَ بالداخل" : "اخرج", reason: "حسب UV.", icon: HomeIcon, color: "text-rose-500" },
  ];
};

const generateStory = (data: WeatherData): string => {
  const { feelsLike, windSpeed, description, uvIndex, humidity } = data;
  let story = "";
  if (feelsLike > 30) story += "الجو حار. "; else if (feelsLike < 10) story += "الجو بارد. "; else story += "الجو معتدل. ";
  if (humidity > 80) story += "رطوبة عالية. "; if (windSpeed > 30) story += "رياح قوية. ";
  story += description;
  return story;
};

const WeatherHero = ({ data, onCityRename }: { data: WeatherData, onCityRename: (n: string) => void }) => {
  const insights = getLifestyleInsights(data);
  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-8 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <EditableLocation city={data.city} onSave={onCityRename} />
          <div className="flex items-center justify-center mb-2 animate-float"><CloudSun className="w-32 h-32 text-amber-500" /></div>
          <h1 className="text-8xl font-bold text-slate-800 tracking-tighter mb-2">{data.temp}°</h1>
          <div className="flex items-center gap-4 text-slate-500 font-medium mb-6 bg-white/50 px-4 py-1 rounded-full border border-white/50"><span>محسوسة: <b className="text-slate-700">{data.feelsLike}°</b></span><span>•</span><span>{data.description}</span></div>
          <div className="grid grid-cols-3 gap-4 w-full border-t border-slate-200/50 pt-6">
            <div className="flex flex-col items-center"><Wind className="w-5 h-5 text-blue-500" /><span>{data.windSpeed}</span></div>
            <div className="flex flex-col items-center"><Droplets className="w-5 h-5 text-cyan-500" /><span>{data.humidity}%</span></div>
            <div className="flex flex-col items-center"><Navigation className="w-5 h-5 text-violet-500" /><span>{data.pressure}</span></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard item={{ icon: Sunrise, title: "الشروق", value: data.sunrise, color: "text-amber-500" }} />
        <InfoCard item={{ icon: Sunset, title: "الغروب", value: data.sunset, color: "text-orange-500" }} />
        <InfoCard item={{ icon: Sun, title: "UV", value: data.uvIndex, color: "text-purple-500" }} />
        <InfoCard item={{ icon: Eye, title: "الرؤية", value: `${Math.round(data.visibility / 1000)} كم`, color: "text-emerald-500" }} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4 px-2 flex items-center gap-2"><Coffee className="w-5 h-5 text-amber-600" /> دليلك اليومي</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {insights.map((item, idx) => (<InfoCard key={idx} item={item} />))}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState('جاري تحديد موقعك...');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [dailyStory, setDailyStory] = useState("");
  const [coords, setCoords] = useState({ lat: 33.5731, lon: -7.5898 });

  const saveLastLocation = (lat: number, lon: number, name: string) => {
    localStorage.setItem('lastLat', lat.toString());
    localStorage.setItem('lastLon', lon.toString());
    localStorage.setItem('lastName', name);
  };

  const handleRename = (newName: string) => {
    if (weather) {
      setWeather({ ...weather, city: newName });
      localStorage.setItem('lastName', newName);
    }
  };

  const fetchWeatherForCity = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setCoords({ lat, lon });
    const data = await getWeather(lat, lon, name);
    setWeather(data);
    setDailyStory(generateStory(data));
    setLoading(false);
    setShowSearch(false);
    setSearchQuery('');
    saveLastLocation(lat, lon, name);
  }, []);

  const smartLocate = useCallback(async () => {
    setLoading(true);
    setLocationStatus('نبحث عنك عبر الأقمار الصناعية...');
    const lastLat = localStorage.getItem('lastLat');
    const lastLon = localStorage.getItem('lastLon');
    const lastName = localStorage.getItem('lastName');

    if (lastLat && lastLon && lastName) {
       const lat = parseFloat(lastLat);
       const lon = parseFloat(lastLon);
       setCoords({ lat, lon });
       const data = await getWeather(lat, lon, lastName);
       setWeather(data);
       setDailyStory(generateStory(data));
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (lastName && lastLat && Math.abs(position.coords.latitude - parseFloat(lastLat)) < 0.01) {
             fetchWeatherForCity(position.coords.latitude, position.coords.longitude, lastName);
          } else {
             const realCityName = await getCityNameFromCoords(position.coords.latitude, position.coords.longitude);
             fetchWeatherForCity(position.coords.latitude, position.coords.longitude, realCityName);
          }
        },
        async () => {
          const ipLocation = await getLocationByIP();
          if (ipLocation) {
             fetchWeatherForCity(ipLocation.lat, ipLocation.lon, ipLocation.city);
          } else if (!lastLat) {
             fetchWeatherForCity(33.5731, -7.5898, 'الدار البيضاء');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
       const ipLocation = await getLocationByIP();
       if (ipLocation) {
          fetchWeatherForCity(ipLocation.lat, ipLocation.lon, ipLocation.city);
       }
    }
  }, [fetchWeatherForCity]);

  useEffect(() => { smartLocate(); }, [smartLocate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (loading && !weather) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium animate-pulse">{locationStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto relative pb-32" dir="rtl">
      <HazardTicker />
      {weather && <HiveMindButton city={weather.city} />}
      <header className="flex justify-between items-center mb-8 relative z-50 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <CloudSun className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 hidden md:block">السماء الواعية</h1>
        </div>
        <div className="flex gap-3 items-center bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
          <div className="relative">
             <input type="text" placeholder="ابحث عن مدينة..." className={`transition-all duration-300 outline-none text-sm px-4 py-2 bg-transparent ${showSearch ? 'w-48 md:w-64' : 'w-0 overflow-hidden opacity-0'} `} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             <button onClick={() => setShowSearch(!showSearch)} className="p-2 bg-slate-100 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-600"><Search className="w-5 h-5" /></button>
             {showSearch && searchResults.length > 0 && (
               <div className="absolute top-12 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-2">
                 {searchResults.map((city) => (
                   <button key={city.id} onClick={() => fetchWeatherForCity(city.latitude, city.longitude, city.name)} className="w-full text-right px-4 py-2.5 hover:bg-blue-50 text-slate-700 text-sm transition-colors flex items-center justify-between">
                     <span>{city.name}</span> <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{city.country}</span>
                   </button>
                 ))}
               </div>
             )}
          </div>
          <button onClick={smartLocate} className="p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors" title="تحديث موقعي"><Navigation className="w-5 h-5" /></button>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {weather && <WeatherHero data={weather} onCityRename={handleRename} />}
          
          <AnalysisRoom lat={coords.lat} lon={coords.lon} />

          <div className="mt-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> خريطة الرصد المباشر</h2>
            <WeatherMap lat={coords.lat} lon={coords.lon} city={weather?.city || ''} />
          </div>
        </div>
        <div className="space-y-6">
           <div className="glass-card p-6 border-l-4 border-l-indigo-500 transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5 text-indigo-600" /><h3 className="text-lg font-bold text-slate-800">خلاصة اليوم</h3></div>
            <p className="text-slate-700 leading-relaxed text-base font-medium">{dailyStory}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
