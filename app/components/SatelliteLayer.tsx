'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Props {
  map: L.Map;
}

export default function SatelliteLayer({ map }: Props) {
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    // رابط Esri World Imagery (الأقوى والأدق)
    const url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const layer = L.tileLayer(url, {
      opacity: 1.0,
      zIndex: 450, // تحت المطر وفوق الحرارة
      attribution: 'Esri',
      maxZoom: 18
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map]);

  return null;
}