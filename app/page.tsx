// app/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Search, MapPin, Navigation } from 'lucide-react';
// استيراد النظام الجديد المفكك
import { getWeather, searchCities, getLocationByIP, getCityNameFromCoords } from './core/weather/api';
import { WeatherData, CityResult } from './core/weather/types';
import LivingScene from './components/LivingScene';
import WeatherHero from './components/WeatherHero';
import HazardTicker from './components/HazardTicker';
import HiveMindButton from './components/HiveMindButton';
import AnalysisRoom from './components/AnalysisRoom';

// استيراد الخريطة (Client Side Only)
const WeatherMap = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center text-slate-500">جاري تحميل الرادار...</div>
});

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [coords, setCoords] = useState({ lat: 33.5731, lon: -7.5898 });

  // 1. دالة الجلب (Memorized)
  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setCoords({ lat, lon }); // تحديث إحداثيات الخريطة
    const data = await getWeather(lat, lon, name);
    setWeather(data);
    setLoading(false);
    setShowSearch(false);
    // حفظ الموقع الأخير في الذاكرة
    localStorage.setItem('lastLat', lat.toString());
    localStorage.setItem('lastLon', lon.toString());
    localStorage.setItem('lastName', name);
  }, []);

  // 2. تحديد الموقع الذكي (مرة واحدة عند البدء)
  useEffect(() => {
    const init = async () => {
      // هل يوجد موقع محفوظ؟
      const lastLat = localStorage.getItem('lastLat');
      const lastLon = localStorage.getItem('lastLon');
      const lastName = localStorage.getItem('lastName');

      if (lastLat && lastLon && lastName) {
        // تحميل البيانات فوراً من الذاكرة
        fetchWeather(parseFloat(lastLat), parseFloat(lastLon), lastName);
      } else if (navigator.geolocation) {
        // إذا لم يوجد، نطلب الـ GPS
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const name = await getCityNameFromCoords(pos.coords.latitude, pos.coords.longitude);
            fetchWeather(pos.coords.latitude, pos.coords.longitude, name);
          },
          async () => {
            // فشل GPS؟ نستخدم IP
            const ip = await getLocationByIP();
            if (ip) fetchWeather(ip.lat, ip.lon, ip.city);
          },
          { enableHighAccuracy: true }
        );
      } else {
        // المتصفح لا يدعم GPS
        const ip = await getLocationByIP();
        if (ip) fetchWeather(ip.lat, ip.lon, ip.city);
      }
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // مصفوفة فارغة = تشغيل مرة واحدة فقط

  // 3. البحث المباشر
  useEffect(() => {
    const t = setTimeout(async () => { 
      if (searchQuery.length > 2) {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  if (loading && !weather) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm opacity-70">جاري الاتصال بالأقمار الصناعية...</p>
      </div>
    );
  }

  // حماية من البيانات الفارغة
  if (!weather) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">تعذر جلب البيانات</div>;

  return (
    <main className="min-h-screen relative font-sans o
