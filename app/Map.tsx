// app/Map.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapRefresher = () => {
  const map = useMap();
  useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 500); }, [map]);
  return null;
};

interface MapProps { lat: number; lon: number; city: string; }

export default function MapComponent({ lat, lon, city }: MapProps) {
  const [ts, setTs] = useState<number | null>(null);
  const OWM_KEY = "e6ca7df7226c2561f77c4f35e7958632"; // مفتاح مجاني

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => { if (data.radar?.past) setTs(data.radar.past[data.radar.past.length - 1].time); })
      .catch(console.error);
  }, []);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative z-0 bg-slate-900">
      <MapContainer center={[lat, lon]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <MapRefresher />
        <LayersControl position="topright" collapsed={false}>
          
          {/* الخلفيات */}
          <LayersControl.BaseLayer checked name="🌍 قمر صناعي (Esri)">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="🗺️ خريطة ملونة">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>

          {/* الطبقات المستعادة */}
          {ts && (
            <LayersControl.Overlay checked name="🌧️ أمطار (RainViewer)">
              <TileLayer url={`https://tile.rainviewer.com/img/radar_nowcast_10min/${ts}/512/{z}/{x}/{y}/2/1_1.png`} opacity={0.8} />
            </LayersControl.Overlay>
          )}
          
          {ts && (
            <LayersControl.Overlay name="☁️ سحب (Infrared)">
              <TileLayer url={`https://tile.rainviewer.com/img/satellite-infrared/${ts}/512/{z}/{x}/{y}/0/0_0.png`} opacity={0.6} />
            </LayersControl.Overlay>
          )}

          <LayersControl.Overlay name="🌡️ حرارة (Global)">
             <TileLayer url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`} opacity={0.5} />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="💨 رياح (Global)">
             <TileLayer url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`} opacity={0.5} />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="🧭 ضغط جوي">
             <TileLayer url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`} opacity={0.5} />
          </LayersControl.Overlay>

        </LayersControl>
        <Marker position={[lat, lon]} icon={icon}><Popup><b>{city}</b></Popup></Marker>
      </MapContainer>
    </div>
  );
}
