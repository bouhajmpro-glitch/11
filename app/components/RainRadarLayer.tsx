'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// نتجنب استيراد الواجهة من ملف آخر لمنع مشاكل المسارات، نعرفها هنا مباشرة
interface RadarFrame {
  time: number;
  path: string;
  isForecast: boolean;
}

interface Props {
  frames: RadarFrame[];
  currentIndex: number;
}

export default function RainRadarLayer({ frames, currentIndex }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!frames || frames.length === 0 || !frames[currentIndex]) return;

    const frame = frames[currentIndex];
    const tileUrl = `https://tile.cache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    const layer = L.tileLayer(tileUrl, {
      opacity: 0.7,
      zIndex: 10,
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, frames, currentIndex]);

  return null;
}