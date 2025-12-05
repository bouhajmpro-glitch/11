'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// استيراد المكونات (تأكد أن RadarPanel موجود في app/components/RadarPanel.tsx)
import RadarPanel from '../components/RadarPanel';
import { fetchRadarFrames, type RadarFrame } from '../core/weather/radarService';

// استيراد الخريطة: نستخدم ../ للعودة للمجلد السابق لأن Map موجودة في app/Map.tsx
// وليس داخل components
const Map = dynamic(() => import('../Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse" />
});

// استيراد الطبقة: نستخدم ../components للوصول للمجلد الصحيح
const RainRadarLayer = dynamic(() => import('../components/RainRadarLayer'), { ssr: false });

export default function RadarPage() {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const initRadar = async () => {
      try {
        const data = await fetchRadarFrames();
        setFrames(data);
        if (data && data.length > 0) {
          // إصلاح خطأ النوع here
          const nowIndex = data.findLastIndex((f: RadarFrame) => !f.isForecast);
          setCurrentIndex(nowIndex > -1 ? nowIndex : 0);
        }
      } catch (e) {
        console.error("خطأ الرادار:", e);
      } finally {
        setLoading(false);
      }
    };
    initRadar();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev >= frames.length - 1 ? 0 : prev + 1));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  return (
    <main className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden relative">
      
      {/* بديل الهيدر المفقود: عنوان بسيط */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
         <h1 className="text-xl font-bold text-center text-white drop-shadow-md">
           رادار الأمطار المباشر
         </h1>
      </div>

      <div className="flex-1 relative w-full h-full z-0">
        <Map>
           {!loading && frames.length > 0 && (
             <RainRadarLayer frames={frames} currentIndex={currentIndex} />
           )}
        </Map>

        {loading && (
           <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-black/40">
             <div className="bg-slate-800 px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl">
               <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <span>جاري الاتصال بالأقمار الصناعية...</span>
             </div>
           </div>
        )}

        {!loading && frames.length > 0 && (
          <div className="absolute bottom-6 left-4 right-4 z-[1000] flex justify-center">
            <div className="w-full max-w-lg">
              <RadarPanel 
                totalFrames={frames.length}
                currentIndex={currentIndex}
                isPlaying={isPlaying}
                currentTimestamp={frames[currentIndex]?.time}
                onPlayPause={setIsPlaying}
                // إصلاح خطأ idx: أي قمنا بتحديد أنه رقم
                onSeek={(idx: number) => {
                  setIsPlaying(false);
                  setCurrentIndex(idx);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}