'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface Props {
  map: L.Map;
  urlTemplate: string; // الرابط مع {ts} كمتغير
  timestamps: number[]; // قائمة الأوقات
  currentIndex: number; // الوقت الحالي
  opacity: number;
}

export default function AnimatedTileLayer({ map, urlTemplate, timestamps, currentIndex, opacity }: Props) {
  const layersRef = useRef<{ [key: number]: L.TileLayer }>({});
  const currentLayerRef = useRef<L.TileLayer | null>(null);

  // 1. التحميل المسبق (Preloading) - السر في السلاسة
  useEffect(() => {
    if (!map || timestamps.length === 0) return;

    // نحمل الإطار الحالي + 2 إطار مستقبلي لضمان عدم التقطع
    const framesToLoad = [
      currentIndex,
      (currentIndex + 1) % timestamps.length,
      (currentIndex + 2) % timestamps.length
    ];

    framesToLoad.forEach(index => {
      const ts = timestamps[index];
      if (!layersRef.current[ts]) {
        // إنشاء الطبقة في الذاكرة (دون إضافتها للخريطة بعد)
        const layer = L.tileLayer(urlTemplate.replace('{ts}', ts.toString()), {
          tileSize: 256,
          opacity: 0, // مخفية في البداية
          zIndex: 400,
          crossOrigin: 'anonymous' // مهم جداً للصور
        });
        
        // البدء في تحميل الصور سراً
        // خدعة: نضيفها للخريطة ثم نخفيها فوراً لتحفيز التحميل
        layer.addTo(map); 
        layersRef.current[ts] = layer;
      }
    });

    // تنظيف الطبقات القديمة جداً لتوفير الذاكرة
    Object.keys(layersRef.current).forEach(key => {
      const ts = parseInt(key);
      const index = timestamps.indexOf(ts);
      // إذا كان الإطار بعيداً جداً عن الحالي، نحذفه
      if (Math.abs(index - currentIndex) > 5) {
        map.removeLayer(layersRef.current[ts]);
        delete layersRef.current[ts];
      }
    });

  }, [currentIndex, timestamps, map, urlTemplate]);

  // 2. حلقة العرض (Render Loop)
  useEffect(() => {
    if (!map || timestamps.length === 0) return;

    const ts = timestamps[currentIndex];
    const nextLayer = layersRef.current[ts];

    if (nextLayer) {
      // إخفاء الطبقة السابقة
      if (currentLayerRef.current && currentLayerRef.current !== nextLayer) {
        currentLayerRef.current.setOpacity(0);
      }

      // إظهار الطبقة الحالية
      nextLayer.setOpacity(opacity);
      // رفعها للأعلى لضمان ظهورها
      nextLayer.bringToFront(); 
      
      currentLayerRef.current = nextLayer;
    }

  }, [currentIndex, opacity, timestamps, map]);

  // تنظيف شامل عند إغلاق المكون
  useEffect(() => {
    return () => {
      Object.values(layersRef.current).forEach(layer => map.removeLayer(layer));
      layersRef.current = {};
    };
  }, [map]);

  return null;
}