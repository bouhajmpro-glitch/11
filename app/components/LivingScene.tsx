// app/components/LivingScene.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { WeatherData } from '../weather';

// محرك البحث عن الصور (Smart Query Engine)
const getSmartImageQuery = (data: WeatherData) => {
  const time = data.isDay ? "day" : "night";
  const conditions = [];
  
  if (data.description.includes("مطر")) conditions.push("rainy");
  if (data.description.includes("غائم")) conditions.push("cloudy sky");
  if (data.description.includes("صافي")) conditions.push("clear blue sky");
  if (data.description.includes("ضباب")) conditions.push("foggy mist");
  if (data.windSpeed > 30) conditions.push("windy storm");
  
  const season = data.temp > 25 ? "summer" : data.temp < 10 ? "winter" : "nature";
  
  // جملة البحث النهائية: "rainy night city aesthetic"
  return `${conditions.join(" ")} ${time} ${season} aesthetic landscape wallpaper`;
};

export default function LivingScene({ data }: { data: WeatherData }) {
  const [bgUrl, setBgUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const query = getSmartImageQuery(data);
    // Unsplash Source (مجاني وعشوائي بناءً على الكلمات)
    const url = `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`;
    setBgUrl(url);
  }, [data]); // يتغير فقط إذا تغيرت البيانات

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
      
      {/* الصورة الخلفية (مع تأثير التلاشي عند التحميل) */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 transform scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        {/* صورة خفية للتحميل */}
        <img 
          src={bgUrl} 
          alt="bg" 
          className="hidden" 
          onLoad={() => setIsLoaded(true)} 
        />
      </div>
      
      {/* طبقة التعتيم الذكية (لجعل النصوص مقروءة) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>

      {/* طبقة المطر الرقمي (فوق الصورة الحقيقية) */}
      {data.description.includes("مطر") && (
        <div className="absolute inset-0 bg-[url('https://ssl.gstatic.com/onebox/weather/64/rain_light.png')] opacity-40 animate-rain pointer-events-none"></div>
      )}

      {/* طبقة البرق (إذا كانت عاصفة) */}
      {data.description.includes("عاصفة") && (
        <div className="absolute inset-0 bg-white/0 animate-lightning pointer-events-none"></div>
      )}

    </div>
  );
}
