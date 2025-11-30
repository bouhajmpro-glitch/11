// app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, MapPin, Navigation, ArrowRight } from 'lucide-react';
import Link from 'next/link'; // للتنقل
// استيراد الدوال (من api.ts)
import { getWeather, searchCities, getLocationByIP, getCityNameFromCoords } from './core/weather/api';
// استيراد الأنواع (من types.ts - المصدر الصحيح)
import { WeatherData, CityResult } from './core/weather/types';

import LivingScene from './components/LivingScene';
import WeatherHero from './components/WeatherHero';
import HazardTicker from './components/HazardTicker';
import HiveMindButton from './components/HiveMindButton';

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
    const data = await getWeather(lat, lon, name);
    setWeather(data);
    setLoading(false);
    setShowSearch(false);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const name = await getCityNameFromCoords(pos.coords.latitude, pos.coords.longitude);
          fetchWeather(pos.coords.latitude, pos.coords.longitude, name);
        },
        () => getLocationByIP().then(ip => { if(ip) fetchWeather(ip.lat, ip.lon, ip.city); }),
        { enableHighAccuracy: true }
      );
    } else {
      getLocationByIP().then(ip => { if(ip) fetchWeather(ip.lat, ip.lon, ip.city); });
    }
  }, [fetchWeather]);

  useEffect(() => {
    const t = setTimeout(async () => { if (searchQuery.length > 2) setSearchResults(await searchCities(searchQuery)); }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  if (!weather) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">تعذر جلب البيانات</div>;

  return (
    <main className="min-h-screen relative font-sans overflow-x-hidden pb-24">
      
      <LivingScene data={weather} />
      <HazardTicker />
      <HiveMindButton city={weather.city} />
      
      <div className="p-4 md:p-6 max-w-lg mx-auto relative z-10">
        
        {/* الرأس */}
        <div className="flex justify-between items-center mb-8 mt-4 text-white">
          <div className="font-bold flex items-center gap-2">السماء الواعية</div>
          <div className="relative">
             {showSearch ? (
               <input autoFocus type="text" placeholder="بحث..." className="bg-white/20 backdrop-blur rounded-full px-4 py-1 text-sm w-32 focus:w-48 transition-all outline-none placeholder-white/50" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onBlur={() => setTimeout(() => setShowSearch(false), 200)} />
             ) : (
               <button onClick={() => setShowSearch(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur"><Search className="w-5 h-5" /></button>
             )}
             {searchResults.length > 0 && (
               <div className="absolute top-10 right-0 w-64 bg-white rounded-xl shadow-xl overflow-hidden py-2 z-50 text-black">
                 {searchResults.map((c) => (
                   <button key={c.id} onClick={() => fetchWeather(c.latitude, c.longitude, c.name)} className="w-full text-right px-4 py-2 hover:bg-slate-100 text-sm">{c.name}</button>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* المكون الرئيسي */}
        <WeatherHero data={weather} onCityRename={(n) => setWeather({...weather, city: n})} />
        
        {/* زر الانتقال للرادار (بدل الخريطة نفسها) */}
        <Link href="/radar">
          <div className="mt-8 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 backdrop-blur rounded-3xl p-6 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-2xl border border-white/20 group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full group-hover:rotate-12 transition-transform">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">غرفة الرادار</h3>
                <p className="text-blue-100 text-sm">الخرائط، الزلازل، وتحليل النماذج</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-[-5px] transition-transform rtl:rotate-180" />
          </div>
        </Link>

      </div>
    </main>
  );
}
