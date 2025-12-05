'use client';
import { useEffect, useRef } from 'react';

interface Props {
  map: any;
  type: 'radar' | 'satellite';
  frames: any[]; // { ts, source }
  currentIndex: number;
}

export default function TileAnimator({ map, type, frames, currentIndex }: Props) {
  const layersRef = useRef<{ [key: number]: any }>({});
  const currentLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !frames || frames.length === 0) return;
    const L = (window as any).L;

    // 1. التحميل المسبق (Preload)
    // نحمل الإطار الحالي + 1 قادم لضمان السلاسة
    const framesToLoad = [
      currentIndex,
      (currentIndex + 1) % frames.length
    ];

    framesToLoad.forEach(idx => {
      const frame = frames[idx];
      if (!frame) return;
      const ts = frame.ts;

      // إذا لم نقم بتحميل هذه الطبقة من قبل، نحملها
      if (!layersRef.current[ts]) {
        let url = '';
        // RainViewer للرادار والأقمار
        if (type === 'radar') {
             url = `https://tile.rainviewer.com/${ts}/256/{z}/{x}/{y}/2/1_1.png`;
        } else {
             url = `https://tile.rainviewer.com/${ts}/256/{z}/{x}/{y}/0/0_0.png`;
        }

        const layer = L.tileLayer(url, {
          tileSize: 256,
          opacity: 0, // مخفي حتى يحين دوره
          zIndex: 500,
          crossOrigin: true // ضروري للصور
        });

        layer.addTo(map);
        layersRef.current[ts] = layer;
      }
    });

    // 2. العرض (Switch Frame)
    const activeFrame = frames[currentIndex];
    if (activeFrame) {
        const ts = activeFrame.ts;
        const newLayer = layersRef.current[ts];

        if (newLayer) {
            // إخفاء الطبقة السابقة
            if (currentLayerRef.current && currentLayerRef.current !== newLayer) {
                currentLayerRef.current.setOpacity(0);
            }
            // إظهار الطبقة الحالية
            newLayer.setOpacity(type === 'radar' ? 0.8 : 1.0);
            currentLayerRef.current = newLayer;
        }
    }

    // تنظيف الذاكرة (حذف الطبقات القديمة جداً)
    const cleanupThreshold = 5;
    Object.keys(layersRef.current).forEach(key => {
      const ts = parseInt(key);
      const idx = frames.findIndex(f => f.ts === ts);
      if (idx === -1 || Math.abs(idx - currentIndex) > cleanupThreshold) {
        map.removeLayer(layersRef.current[ts]);
        delete layersRef.current[ts];
      }
    });

  }, [map, type, frames, currentIndex]);

  // تنظيف نهائي
  useEffect(() => {
    return () => {
      Object.values(layersRef.current).forEach((layer: any) => map.removeLayer(layer));
      layersRef.current = {};
    };
  }, [map, type]);

  return null;
}