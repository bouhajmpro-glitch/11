// app/components/LivingScene.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { WeatherData } from '../core/weather/types';

// محرك الصور الذكي
const getSmartImageQuery = (data: WeatherData) => {
  const time = data.isDay ? "day" : "night";
  const weather = data.description.includes("مطر") ? "rainy" 
    : data.description.includes("غائم") ? "cloudy" 
    : data.description.includes("صافي") ? "clear blue sky" 
    : "weather";
  const season = data.temp > 25 ? "summer" : data.temp < 10 ? "winter" : "nature";
  
  return `${weather} ${time} ${season} aesthetic wallpaper`;
};

export default function LivingScene({ data }: { data: WeatherData }) {
  const [bgUrl, setBgUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!data) return;
    const query = getSmartImageQuery(data);
    // Unsplash Source (رابط مباشر لصورة عشوائية)
    const url = `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`;
    setBgUrl(url);
  }, [data]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 transform scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={bgUrl} 
          alt="bg" 
          className="hidden" 
          onLoad={() => setIsLoaded(true)} 
          onError={() => setIsLoaded(true)} // في حال فشل الصورة، نظهر الخلفية الافتراضية
        />
      </div>
      
      {/* طبقة التعتيم */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>

      {/* تأثير المطر */}
      {data?.description?.includes("مطر") && (
        <div className="absolute inset-0 bg-[url('https://ssl.gstatic.com/onebox/weather/64/rain_light.png')] opacity-40 animate-rain pointer-events-none"></div>
      )}
    </div>
  );
}
