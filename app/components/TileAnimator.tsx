'use client';
import { useEffect, useRef } from 'react';

interface Props {
  map: any;
  type: 'radar' | 'satellite';
  frames: number[]; // قائمة التوقيتات
  currentIndex: number; // الإطار الحالي
}

export default function TileAnimator({ map, type, frames, currentIndex }: Props) {
  const layersRef = useRef<{ [key: number]: any }>({});
  const currentLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || frames.length === 0) return;
    const L = (window as any).L;

    // 1. استراتيجية التحميل المسبق (Preload Strategy)
    // نحمل الإطار الحالي + الإطارين القادمين لضمان السلاسة
    const framesToLoad = [
      currentIndex,
      (currentIndex + 1) % frames.length,
      (currentIndex + 2) % frames.length
    ];

    framesToLoad.forEach(idx => {
      const ts = frames[idx];
      if (!layersRef.current[ts]) {
        let url = '';
        if (type === 'radar') {
          // RainViewer Radar
          url = `https://tile.rainviewer.com/${ts}/256/{z}/{x}/{y}/2/1_1.png`;
        } else {
          // RainViewer Satellite
          url = `https://tile.rainviewer.com/${ts}/256/{z}/{x}/{y}/0/0_0.png`;
        }

        const layer = L.tileLayer(url, {
          tileSize: 256,
          opacity: 0, // نبدأ مخفياً
          zIndex: 500,
          crossOrigin: true
        });

        layer.addTo(map);
        layersRef.current[ts] = layer;
      }
    });

    // 2. التبديل (Switching)
    const activeTs = frames[currentIndex];
    const newLayer = layersRef.current[activeTs];

    if (newLayer) {
      if (currentLayerRef.current && currentLayerRef.current !== newLayer) {
        currentLayerRef.current.setOpacity(0); // إخفاء السابق
      }
      newLayer.setOpacity(type === 'radar' ? 0.8 : 1.0); // إظهار الحالي
      currentLayerRef.current = newLayer;
    }

    // تنظيف الطبقات القديمة جداً لتوفير الذاكرة
    const cleanupThreshold = 5;
    Object.keys(layersRef.current).forEach(key => {
      const ts = parseInt(key);
      const idx = frames.indexOf(ts);
      // إذا كان الإطار بعيداً عن المؤشر الحالي، نحذفه
      if (idx !== -1 && Math.abs(idx - currentIndex) > cleanupThreshold) {
        map.removeLayer(layersRef.current[ts]);
        delete layersRef.current[ts];
      }
    });

  }, [map, type, frames, currentIndex]);

  // تنظيف كامل عند الخروج
  useEffect(() => {
    return () => {
      Object.values(layersRef.current).forEach((layer: any) => map.removeLayer(layer));
      layersRef.current = {};
    };
  }, [map, type]);

  return null;
}