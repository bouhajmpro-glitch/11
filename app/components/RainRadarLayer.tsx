'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Props {
  map: L.Map;
  timestamp: number;
}

export default function RainRadarLayer({ map, timestamp }: Props) {
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    // 1. استخدام وقت آمن (آخر 10 دقائق) إذا لم يتوفر وقت
    const now = Math.floor(Date.now() / 1000);
    const safeTs = timestamp > 0 ? timestamp : (now - (now % 600) - 600);

    // 2. رابط RainViewer المجاني المباشر
    const url = `https://tile.rainviewer.com/${safeTs}/256/{z}/{x}/{y}/2/1_1.png`;

    // 3. إزالة الطبقة القديمة
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // 4. إضافة الطبقة الجديدة
    const layer = L.tileLayer(url, {
      opacity: 0.8,
      zIndex: 500, // فوق الحرارة
      attribution: 'RainViewer'
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, timestamp]);

  return null;
}