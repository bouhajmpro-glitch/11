'use client';
import { useEffect, useRef, useState } from 'react';
import { getWindData } from '../core/weather/api';

interface Props {
  map: any;
  active: boolean;
}

// قائمة مصادر بديلة (Mirrors) لضمان التحميل
const JS_MIRRORS = [
  'https://unpkg.com/leaflet-velocity@1.5.2/dist/leaflet-velocity.js', // المصدر 1
  'https://cdn.jsdelivr.net/npm/leaflet-velocity@1.5.2/dist/leaflet-velocity.min.js', // المصدر 2
  'https://rawcdn.githack.com/onaci/leaflet-velocity/master/dist/leaflet-velocity.js' // المصدر 3 (احتياطي)
];

const CSS_MIRRORS = [
  'https://unpkg.com/leaflet-velocity@1.5.2/dist/leaflet-velocity.css',
  'https://cdn.jsdelivr.net/npm/leaflet-velocity@1.5.2/dist/leaflet-velocity.min.css'
];

export default function WindLayer({ map, active }: Props) {
  const layerRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [debugMsg, setDebugMsg] = useState('جاري الاتصال...');

  // 1. نظام التحميل الذكي (Smart Loader)
  useEffect(() => {
    const loadResources = async () => {
      try {
        // أ) التأكد من وجود Leaflet أولاً
        if (typeof window !== 'undefined') {
          if (!(window as any).L) {
            (window as any).L = await import('leaflet');
          }
        }

        // ب) تحميل CSS (نحاول المصادر بالترتيب)
        if (!document.getElementById('velocity-css')) {
          let cssLoaded = false;
          for (const url of CSS_MIRRORS) {
            try {
              await loadCSS(url);
              cssLoaded = true;
              break; 
            } catch (e) { continue; }
          }
          if (!cssLoaded) console.warn("فشل تحميل تنسيقات الرياح، لكن سنكمل");
        }

        // ج) تحميل JS (محرك الرياح) - المحاولة مع التكرار
        if (!(window as any).L.velocityLayer) {
          let jsLoaded = false;
          
          for (const url of JS_MIRRORS) {
            try {
              setDebugMsg(`جاري التحميل من المصدر: ${new URL(url).hostname}...`);
              await loadScript(url);
              
              // انتظار قصير للتأكد من التهيئة
              await new Promise(r => setTimeout(r, 100));
              
              if ((window as any).L.velocityLayer) {
                jsLoaded = true;
                break; // نجحنا! نخرج من الحلقة
              }
            } catch (e) {
              console.warn(`فشل المصدر ${url}، ننتقل للتالي...`);
            }
          }

          if (!jsLoaded) throw new Error("فشلت جميع مصادر تحميل محرك الرياح");
        }

        setStatus('ready');
      } catch (e: any) {
        console.error("Wind Critical Error:", e);
        setStatus('error');
        setDebugMsg("فشل الاتصال بخوادم الخرائط");
      }
    };

    loadResources();
  }, []);

  // 2. رسم الطبقة
  useEffect(() => {
    if (!map || status !== 'ready' || !active) {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    const draw = async () => {
      // تنظيف قبل الرسم
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      try {
        setDebugMsg("جاري جلب بيانات الرياح الحية...");
        const windData = await getWindData();
        const L = (window as any).L;

        if (windData && L && L.velocityLayer) {
          
          // إعداد طبقة العرض (Pane)
          if (!map.getPane('windPane')) {
            map.createPane('windPane');
            map.getPane('windPane').style.zIndex = 650;
            map.getPane('windPane').style.pointerEvents = 'none';
          }

          layerRef.current = L.velocityLayer({
            displayValues: true,
            displayOptions: {
              velocityType: 'Global Wind',
              position: 'bottomleft',
              emptyString: 'No data',
              angleConvention: 'bearingCW',
              displayEmptyString: 'No data',
              speedUnit: 'km/h'
            },
            data: windData,
            maxVelocity: 15,
            velocityScale: 0.008, // حجم الجسيمات
            particleAge: 90,      // مسافة الحركة
            particleMultiplier: 1/300, // الكثافة
            opacity: 0.97,
            colorScale: ["rgb(255, 255, 255)"], // لون أبيض للظهور على الخلفية الداكنة
            pane: 'windPane'
          });

          layerRef.current.addTo(map);
          setDebugMsg(""); // نجاح، نخفي الرسالة
        } else {
          setDebugMsg("بيانات الرياح غير متاحة حالياً");
        }
      } catch (e) {
        console.error("Render Error:", e);
        setDebugMsg("خطأ في معالجة بيانات الرياح");
      }
    };

    draw();

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, active, status]);

  // عرض رسائل الحالة (للمساعدة في التشخيص)
  if (status === 'error') {
    return (
      <div className="absolute top-20 left-4 bg-red-900/90 text-white text-[10px] px-3 py-2 rounded-xl z-[1000] border border-red-500/50 backdrop-blur-md">
        ⚠️ {debugMsg}
      </div>
    );
  }

  if (status === 'loading' && active) {
    return (
      <div className="absolute bottom-20 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded z-[1000] animate-pulse">
        {debugMsg}
      </div>
    );
  }

  return null;
}

// دوال التحميل المساعدة (Promisified)
function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    
    document.head.appendChild(script);
  });
}

function loadCSS(href: string) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) return resolve(true);
    
    const link = document.createElement('link');
    link.id = 'velocity-css'; // معرف فريد لمنع التكرار
    link.rel = 'stylesheet';
    link.href = href;
    
    link.onload = () => resolve(true);
    link.onerror = () => reject(new Error(`Failed to load CSS ${href}`));
    
    document.head.appendChild(link);
  });
}