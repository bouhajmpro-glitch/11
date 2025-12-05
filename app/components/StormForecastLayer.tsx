'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function StormForecastLayer({ active }: { active: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    // استخدام طبقة CAPE من OpenWeatherMap (مجانية في بعض الاشتراكات) أو مصدر بديل
    // إذا لم تتوفر، نستخدم طبقة الضغط والغيوم من RainViewer كبديل بصري
    // RainViewer يوفر طبقة "coverage" للسحب التي قد تحمل أمطاراً
    
    // هنا سنستخدم طبقة RainViewer الخاصة بـ "الأقمار الصناعية بالأشعة تحت الحمراء" (Infrared)
    // لأن السحب البيضاء الساطعة في الأشعة تحت الحمراء تعني سحباً ركامية عالية (عواصف)
    const stormLayer = L.tileLayer('https://tile.cache.rainviewer.com/v2/satellite-infrared/{z}/{x}/{y}/256/0/1_1.png', {
      opacity: 0.6,
      zIndex: 5
    });

    stormLayer.addTo(map);

    return () => {
      map.removeLayer(stormLayer);
    };
  }, [map, active]);

  return null;
}