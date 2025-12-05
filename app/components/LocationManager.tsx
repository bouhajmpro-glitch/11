'use client';

import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MapPin, Navigation, LocateFixed } from 'lucide-react';

export function LocationManager() {
  const map = useMap();
  const [loc, setLoc] = useState({ 
    hood: '',
    city: '',
    country: '',
    full: 'جاري تحديد الموقع بدقة...'
  });

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 14, enableHighAccuracy: true })
       .on("locationfound", async (e) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1&accept-language=ar`
            );
            const data = await res.json();
            
            if (data.address) {
              const addr = data.address;
              
              // ترتيب الدقة: الأضيق -> الأوسع
              const street = addr.road || addr.pedestrian || addr.footway || addr.path || addr.cycleway || '';
              const neighborhood = addr.neighbourhood || addr.suburb || addr.quarter || '';
              const city = addr.city || addr.town || addr.village || addr.municipality || '';
              const country = addr.country || '';

              setLoc({
                hood: street || neighborhood || city || 'موقع محدد',
                city: city,
                country: country,
                full: [street, neighborhood, city, country].filter(Boolean).join('، ') // السرد الكامل
              });

              // إضافة دائرة زرقاء نابضة حول موقع المستخدم (لتحديد "المستعمل")
              if ((window as any).L) {
                 const L = (window as any).L;
                 L.circleMarker(e.latlng, { radius: 6, fillColor: "#3b82f6", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(map);
              }

            }
          } catch(err) {
            setLoc(prev => ({ ...prev, hood: 'تعذر تحديد العنوان', loading: false }));
          }
       })
       .on("locationerror", () => {
         setLoc(prev => ({ ...prev, hood: 'تعذر الوصول (GPS)', loading: false }));
       });
  }, [map]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
       <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-600/50 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 transition-all hover:bg-slate-900/95 pointer-events-auto">
          <div className="bg-blue-600/20 p-2 rounded-full">
             <LocateFixed className="text-blue-400 w-5 h-5 animate-pulse" />
          </div>

          <div className="flex flex-col items-start min-w-[140px]">
             {loc.hood === 'موقع محدد' ? (
               <span className="text-sm text-slate-300">جاري تحديد الموقع بدقة...</span>
             ) : (
               <>
                 <div className="flex items-baseline gap-1">
                   <span className="font-bold text-lg">{loc.city || loc.hood}</span>
                   <span className="text-[10px] text-slate-400 font-light tracking-wider uppercase">{loc.country}</span>
                 </div>
                 <div className="flex items-center gap-1 text-xs text-blue-200 mt-0.5">
                   <Navigation size={10} />
                   <span>{loc.hood}</span>
                 </div>
               </>
             )}
          </div>
       </div>
    </div>
  );
}