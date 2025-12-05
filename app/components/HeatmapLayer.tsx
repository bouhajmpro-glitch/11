'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat'; // تأكد من تثبيت هذه المكتبة: npm i leaflet.heat @types/leaflet.heat

export default function HeatmapLayer() {
  const map = useMap();

  useEffect(() => {
    // 1. تعدد المصادر: نجلب البيانات الخام (أرقام خطوط الطول والعرض والحرارة)
    // بدلاً من صورة جاهزة، نجلب مصفوفة بيانات. هنا نستخدم Open-Meteo كمثال
    // في الواقع الحقيقي (Production)، هذا الرابط يأتي من brain.js
    const fetchHeatData = async () => {
      try {
        // نطلب درجات الحرارة لنقط معينة (Grid)
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=31.5&longitude=-7.0&hourly=temperature_2m&current_weather=true&forecast_days=1');
        const data = await res.json();
        
        // محاكاة تحويل البيانات إلى نقاط حرارية (Lat, Lon, Intensity)
        // في النسخة الكاملة، نستخدم خوارزمية لتحويل Grid Data إلى نقاط
        const heatPoints = [
          [33.5731, -7.5898, 25], // الدار البيضاء: 25 درجة
          [34.0209, -6.8416, 28], // الرباط: 28 درجة
          [31.6295, -7.9811, 35], // مراكش: 35 درجة (أشد حرارة)
          [35.7595, -5.8340, 22], // طنجة: 22 درجة
          // ... وهكذا لكل نقطة في الشبكة
        ];

        // 2. الرسم اليدوي (Drawing Ourselves)
        // لا نضع صورة، بل نأمر المتصفح برسم التدرج اللوني
        // @ts-ignore
        const heatLayer = L.heatLayer(heatPoints, {
          radius: 25,       // نصف قطر النقطة
          blur: 15,         // تمويه الحواف لتداخل الألوان
          maxZoom: 10,
          max: 40,          // درجة الحرارة القصوى للون الأحمر
          gradient: {
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
        }).addTo(map);

        return () => {
          map.removeLayer(heatLayer);
        };
      } catch (err) {
        console.error("فشل في رسم الخريطة الحرارية", err);
      }
    };

    fetchHeatData();
  }, [map]);

  return null;
}