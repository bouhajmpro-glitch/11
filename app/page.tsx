'use client';

import React, { useState, useEffect } from 'react';
import { getWeather, getCityNameFromCoords } from './core/weather/api';
import { WeatherData } from './core/weather/types';

import { SmartNowcast } from './components/SmartNowcast';
import { MainForecast } from './components/MainForecast';
import { IndicatorsGrid } from './components/IndicatorsGrid';
import { HourlyScroll } from './components/HourlyScroll';
import { HazardTicker } from './components/HazardTicker';

import { AlertTriangle, MapPin, Navigation } from 'lucide-react';

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('جاري تحديد موقعك...');

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      setStatusMsg('جاري الاتصال بالأقمار الصناعية...');
      const cityName = await getCityNameFromCoords(lat, lon);
      const data = await getWeather(lat, lon, cityName);
      setWeather(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('فشل في جلب بيانات الطقس.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
        (err) => {
          console.warn("Geolocation blocked:", err);
          fetchWeatherByCoords(34.0209, -6.8416); // الرباط
        }
      );
    } else {
      fetchWeatherByCoords(34.0209, -6.8416);
    }
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4 font-sans" dir="rtl">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Navigation size={16} className="text-blue-500 animate-pulse" />
        </div>
      </div>
      <p className="animate-pulse text-sm text-blue-200">{statusMsg}</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-red-400 gap-4" dir="rtl">
      <AlertTriangle size={48} />
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-full transition-all">
        إعادة المحاولة
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 bg-gradient-to-b from-[#0f172a]/80 via-[#0f172a]/95 to-[#0f172a] pointer-events-none"></div>
      
      {/* تمرير أخبار الطقس والفلك الحقيقية إلى الشريط */}
      <div className="relative z-20 pt-2">
        {weather && <HazardTicker news={weather.newsTicker} />}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-8 md:px-8">
        {weather && (
          <>
            <div className="flex justify-between items-center mb-6 text-xs text-slate-400 px-2 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-400" />
                <span className="font-bold text-white tracking-wide">{weather.city}, {weather.country}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="bg-blue-500/10 px-2 py-1 rounded text-blue-300 border border-blue-500/20 font-mono text-[10px]">
                   {weather.source}
                 </span>
              </div>
            </div>

            <SmartNowcast data={weather} />
            
            <MainForecast 
              city={weather.city}
              temp={weather.temp}
              icon={weather.weatherCode >= 0 ? `//cdn.weatherapi.com/weather/64x64/${weather.isDay ? 'day' : 'night'}/113.png` : ''} 
              desc={weather.description}
              summary={`اليوم: ${weather.description}. العظمى ${Math.round(weather.daily.maxTemp[0])}° والصغرى ${Math.round(weather.daily.minTemp[0])}°.`}
            />
            
            <HourlyScroll data={weather} />

            <IndicatorsGrid data={weather} />
            
            <div className="mt-16 mb-24">
              <div className="flex items-center gap-2 mb-6 px-4">
                <div className="h-6 w-1 bg-purple-500 rounded-full"></div>
                <h3 className="text-white/90 font-bold text-lg">الأيام القادمة</h3>
              </div>
              
              <div className="flex overflow-x-auto pb-6 gap-3 no-scrollbar px-4">
                {weather.daily.time.map((t, i) => (
                  <div key={i} className="min-w-[110px] bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-4 flex flex-col items-center border border-white/5 relative overflow-hidden group">
                    <span className="text-xs text-blue-200 mb-3 font-medium">
                      {new Date(t).toLocaleDateString('ar-MA', { weekday: 'long' })}
                    </span>
                    <div className="text-2xl mb-2">
                       {weather.daily.rainSum[i] > 1 ? '🌧️' : (weather.daily.maxTemp[i] > 25 ? '☀️' : '⛅')}
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-xl font-bold text-white">{Math.round(weather.daily.maxTemp[i])}°</span>
                      <span className="text-xs text-white/40 mb-1">{Math.round(weather.daily.minTemp[i])}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <footer className="text-center text-slate-500 text-[10px] pb-8 mt-12 border-t border-white/5 pt-8">
          <p className="mb-2">نظام الطقس الذري v3.5 • Fusion News Engine</p>
        </footer>
      </div>
    </main>
  );
}