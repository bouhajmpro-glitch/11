'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// هذا الجزء هو الحل: نعرف أن الخريطة تقبل "أبناء" (children)
interface MapProps {
  children?: React.ReactNode; 
  className?: string;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [map]);
  return null;
}

export default function Map({ children, className }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">جاري تحميل الخريطة...</div>;
  }

  return (
    <MapContainer
      center={[31.7917, -7.0926]}
      zoom={6}
      scrollWheelZoom={true}
      className={`w-full h-full z-0 ${className || ''}`}
      style={{ minHeight: '100%', minWidth: '100%', background: '#0f172a' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizer />
      
      {/* هذا هو السطر المفقود سابقاً */}
      {children}
    </MapContainer>
  );
}