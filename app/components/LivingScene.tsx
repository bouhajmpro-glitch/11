'use client';
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../core/weather/types';

export default function LivingScene({ data }: { data: WeatherData | null }) {
  const [bgUrl, setBgUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  
  // خلفية متدرجة تظهر فوراً قبل تحميل الصورة
  const getGradient = () => {
    if (!data) return "bg-slate-900";
    if (!data.isDay) return "bg-gradient-to-b from-slate-900 via-purple-900 to-slate-800";
    if (data.weatherCode > 50) return "bg-gradient-to-b from-slate-700 via-slate-500 to-slate-400"; // مطر/غيوم
    return "bg-gradient-to-b from-blue-500 via-blue-300 to-blue-100"; // صافي
  };

  useEffect(() => {
    if (!data) return;
    // منطق اختيار الكلمات المفتاحية
    const time = data.isDay ? "day" : "night";
    const condition = data.description.includes("مطر") ? "rain" : data.description.includes("غائم") ? "cloudy" : "clear sky";
    // استخدام Unsplash Source بدقة عالية
    const query = `${condition},${time},landscape,nature`;
    setBgUrl(`https://source.unsplash.com/1600x900/?${query}`);
    setIsLoaded(false); // إعادة تعيين عند تغيير الطقس
  }, [data?.city, data?.weatherCode, data?.isDay]); // التحديث فقط عند تغير هذه القيم

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${getGradient()} transition-colors duration-1000`}>
      {/* طبقة الصورة */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out transform scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        {/* خدعة لتحميل الصورة في الخلفية */}
        {bgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={bgUrl} 
            alt="bg" 
            className="hidden" 
            onLoad={() => setIsLoaded(true)} 
          />
        )}
      </div>
      
      {/* طبقة التعتيم للقراءة */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>

      {/* تأثيرات CSS خاصة (مطر/ثلج) */}
      {data?.description.includes("مطر") && (
        <div className="absolute inset-0 bg-[url('https://ssl.gstatic.com/onebox/weather/64/rain_light.png')] opacity-30 animate-rain pointer-events-none mix-blend-screen"></div>
      )}
    </div>
  );
}