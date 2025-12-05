'use client';

import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

interface MapProps {
  children?: React.ReactNode; 
  className?: string;
  mapType?: 'street' | 'satellite' | 'dark';
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 200);
  }, [map]);
  return null;
}

export default function Map({ children, className, mapType = 'dark' }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return <div className="w-full h-full bg-slate-950 flex items-center justify-center text-white">جاري تحميل المختبر...</div>;

  const getTileLayer = () => {
    switch(mapType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'street':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'dark':
      default:
        // نسخة داكنة عالية التباين للمختبرات
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  return (
    <MapContainer
      center={[34.5333, -4.6333]} // تاونات
      zoom={10}
      zoomControl={false}
      scrollWheelZoom={true}
      className={`w-full h-full z-0 ${className || ''}`}
      style={{ minHeight: '100vh', width: '100%', background: '#0f172a' }}
    >
      <TileLayer
        // --- الإصلاح الجوهري هنا ---
        // استخدام key يجبر الخريطة على التحديث عند تغيير النوع
        key={mapType} 
        attribution='&copy; OpenStreetMap & Esri'
        url={getTileLayer()}
        zIndex={0}
      />
      
      <ZoomControl position="bottomleft" />
      <MapResizer />
      {children}
    </MapContainer>
  );
}