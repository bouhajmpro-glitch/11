"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";

// الاستيراد الديناميكي مع المسار الصحيح (تأكد أن components في جذر المشروع)
const WeatherMap = dynamic(() => import("../components/WeatherMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">جاري تهيئة نظام الخرائط...</p>
    </div>
  ),
});

export default function RadarPage() {
  const adScanRan = useRef(false);

  useEffect(() => {
    if (adScanRan.current) return;
    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
         ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
         adScanRan.current = true;
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <main className="relative w-full h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      
      <Script
        id="adsbygoogle-init"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1228612926717557"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* الرأس الشفاف */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
            <h1 className="text-xl font-bold text-white drop-shadow-md flex items-center gap-2">
              <span className="text-blue-500">🌍</span> RAJAWI <span className="text-gray-300 font-light">PRO MAP</span>
            </h1>
        </div>
      </header>

      {/* الخريطة */}
      <div className="flex-grow relative w-full h-full z-10">
        <WeatherMap />
      </div>

      {/* الإعلان */}
      <div className="w-full bg-slate-900 z-30 flex justify-center py-1 border-t border-slate-700">
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "90px", maxWidth: "728px" }}
            data-ad-client="ca-pub-1228612926717557"
            data-ad-slot="YOUR_AD_SLOT_ID_HERE" 
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
      </div>

    </main>
  );
}