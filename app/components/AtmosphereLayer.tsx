'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function AtmosphereLayer({ active, type }: { active: boolean, type: 'temp' | 'wind' }) {
  const map = useMap();

  useEffect(() => {
    // تنظيف الطبقة فوراً عند تغيير الإعدادات
    const cleanUp = () => {
       map.eachLayer((l) => { if ((l as any)._heatId) map.removeLayer(l); });
    };

    if (!active) {
      cleanUp();
      return;
    }

    const paintAtmosphere = async () => {
      cleanUp(); // تنظيف قبل الرسم الجديد

      const center = map.getCenter();
      const points: [number, number, number][] = []; // تحديد النوع بوضوح
      
      // توسيع نطاق البحث ليشمل الشاشة كاملة
      const bounds = map.getBounds();
      const spread = 0.05; // دقة الشبكة (كلما صغر الرقم زادت الدقة والثقل)
      
      // نولد نقاطاً تغطي المنطقة المرئية فقط (Optimization)
      for(let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += spread) {
        for(let lon = bounds.getWest(); lon <= bounds.getEast(); lon += spread) {
          points.push([lat, lon, 0]); // 0 قيمة مبدئية
        }
      }

      // تقليص عدد النقاط لتجنب بطء المتصفح (نأخذ عينة عشوائية أو مرتبة)
      // في وضع الإنتاج الحقيقي، يجب جلب هذه البيانات كـ Grid Image من السيرفر
      // لكن هنا سنحاكيها عبر جلب عينات من API
      
      // سنكتفي بـ 20 نقطة موزعة لمحاكاة الغلاف الجوي وتوفير الطلبات
      const samplePoints = points.filter((_, i) => i % Math.ceil(points.length / 20) === 0);

      const requests = samplePoints.map(async (p) => {
        try {
          // جلب بيانات حقيقية
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p[0]}&longitude=${p[1]}&current=temperature_2m,wind_speed_10m&timezone=auto`);
          const d = await res.json();
          return [
            p[0], 
            p[1], 
            type === 'temp' ? d.current.temperature_2m : d.current.wind_speed_10m
          ] as [number, number, number];
        } catch { return null; }
      });

      const results = await Promise.all(requests);
      const heatPoints = results.filter(r => r !== null) as [number, number, number][];

      if (heatPoints.length > 0) {
        // --- تصحيح الخطأ هنا ---
        // نقوم بتعريف النوع صراحة ليقبل TypeScript التغيير
        const gradient: { [key: number]: string } = type === 'temp' 
          ? { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' } // تدرج الحرارة
          : { 0.4: 'rgba(255,255,255,0)', 0.8: 'cyan', 1.0: 'white' }; // تدرج الرياح (شفاف إلى أبيض)

        // رسم الطبقة
        // @ts-ignore (لتجاوز أخطاء تعريف المكتبة الناقصة أحياناً)
        const heat = L.heatLayer(heatPoints, {
          radius: 60,  // نصف قطر التوهج
          blur: 40,    // التمويه لتبدو كالغاز
          maxZoom: 10,
          max: type === 'temp' ? 40 : 80, // الحد الأقصى للقيمة
          gradient: gradient
        });

        (heat as any)._heatId = 'atmosphere';
        heat.addTo(map);
      }
    };

    paintAtmosphere();
    
    // تحديث عند التحريك (مع تأخير بسيط للأداء)
    const handleMove = () => { setTimeout(paintAtmosphere, 500); };
    map.on('moveend', handleMove);

    return () => {
      map.off('moveend', handleMove);
      cleanUp();
    };
  }, [map, active, type]);

  return null;
}