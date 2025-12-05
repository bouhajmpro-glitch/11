'use client';
import { useEffect, useRef } from 'react';

interface Props {
  map: any;
  activeLayer: string;
  timestamp: number;
}

export default function WeatherLayers({ map, activeLayer, timestamp }: Props) {
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !(window as any).L) return;

    // إذا كانت الرياح أو الحرارة أو الضغط أو السحب، نخرج
    // لأن WindLayer و HeatmapLayer مسؤولون عنهم
    if (['wind', 'temp', 'pressure', 'clouds'].includes(activeLayer)) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    let layerUrl = '';
    let options: any = {
      tileSize: 256,
      opacity: 0.8,
      zIndex: 500,
      crossOrigin: true // RainViewer يقبل هذا عادة، إذا فشل سنزيله
    };

    // حماية التوقيت للرادار
    const now = Math.floor(Date.now() / 1000);
    // نستخدم توقيت آمن (الآن - 10 دقائق) إذا كان التوقيت المرسل 0
    const safeTs = timestamp > 0 ? timestamp : (now - 600);

    switch (activeLayer) {
      case 'radar':
        // طبقة الرادار من RainViewer
        layerUrl = `https://tile.rainviewer.com/${safeTs}/256/{z}/{x}/{y}/2/1_1.png`;
        options.opacity = 0.8;
        break;
      
      case 'satellite':
        // طبقة الأقمار من RainViewer
        layerUrl = `https://tile.rainviewer.com/${safeTs}/256/{z}/{x}/{y}/0/0_0.png`;
        options.opacity = 1.0;
        break;
    }

    if (layerUrl) {
      // إزالة القديم
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }

      try {
        const newLayer = L.tileLayer(layerUrl, options);
        newLayer.addTo(map);
        layerRef.current = newLayer;
      } catch (e) {
        console.error("Layer Add Error:", e);
      }
    } else {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    }

  }, [map, activeLayer, timestamp]);

  return null;
}